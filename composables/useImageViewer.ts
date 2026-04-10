import { ref, nextTick, onBeforeUnmount } from 'vue'

export interface ImageAttachment {
  id?: number | string
  file_url: string
  file_name?: string | null
}

// Global active flag so multiple components can coordinate dismiss behavior
const globalViewerActive = ref(false)

export const useImageViewer = () => {
  const galleryImages = ref<Array<{ src: string; alt: string }>>([])
  const attachmentGalleryRef = ref<HTMLElement | null>(null)
  let viewerInstance: any = null
  let tempGalleryContainer: HTMLElement | null = null
  const viewerBlockedEvents: string[] = []
  const viewerScrollEvents = ['wheel', 'touchmove']
  let viewerEventHandlers: Array<{ type: string; handler: (event: Event) => void }> = []
  let viewerScrollGuards: Array<{ type: string; handler: (event: Event) => void }> = []
  let viewerEscapeHandler: ((event: KeyboardEvent) => void) | null = null
  let globalScrollBlockers: Array<{ type: string; handler: (event: Event) => void }> = []
  // Use the global ref so state is shared across all users of this composable
  const isViewerActive = globalViewerActive
  let ViewerClass: any = null
  let prevBodyOverflow: string | null = null

  // Lazy load viewerjs only on client side
  const initViewer = async () => {
    if (ViewerClass || !import.meta.client) return
    
    try {
      const viewerModule = await import('viewerjs')
      ViewerClass = viewerModule.default
      await import('viewerjs/dist/viewer.css')
    } catch (error) {
      console.error('[useImageViewer] Failed to load viewerjs:', error)
    }
  }

  const isImageAttachment = (attachment: ImageAttachment): boolean => {
    if (!attachment || !attachment.file_url) return false
    
    // Check file type by extension
    const url = attachment.file_url.toLowerCase()
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']
    return imageExtensions.some((ext) => url.includes(ext))
  }

  const getAttachmentIcon = (fileType?: string | null): string => {
    switch ((fileType || '').toLowerCase()) {
      case 'image':
        return 'i-heroicons-photo'
      case 'audio':
        return 'i-heroicons-musical-note'
      case 'video':
        return 'i-heroicons-play'
      case 'document':
        return 'i-heroicons-document-text'
      default:
        return 'i-heroicons-paper-clip'
    }
  }

  const openViewer = async (
    images: ImageAttachment[],
    targetImage: ImageAttachment,
    containerRef?: HTMLElement | null,
  ) => {
    await initViewer()
    
    if (!ViewerClass) {
      console.warn('[useImageViewer] ViewerClass not loaded')
      return
    }

    const imageList = images.filter(isImageAttachment)
    if (!imageList.length) return

    const targetIndex = imageList.findIndex((img) => img.id === targetImage.id)
    if (targetIndex === -1) return

    galleryImages.value = imageList.map((img) => ({
      src: img.file_url,
      alt: img.file_name || 'Image attachment',
    }))

    await nextTick()

    // Build a top-level, hidden gallery container at body level to avoid conflicts with drawers/modals
    if (tempGalleryContainer) {
      try {
        tempGalleryContainer.remove()
      } catch {}
      tempGalleryContainer = null
    }
    tempGalleryContainer = document.createElement('div')
    tempGalleryContainer.style.position = 'fixed'
    tempGalleryContainer.style.left = '-99999px'
    tempGalleryContainer.style.top = '-99999px'
    tempGalleryContainer.setAttribute('aria-hidden', 'true')
    for (const img of galleryImages.value) {
      const el = document.createElement('img')
      el.src = img.src
      el.alt = img.alt
      tempGalleryContainer.appendChild(el)
    }
    document.body.appendChild(tempGalleryContainer)
    const galleryContainer = tempGalleryContainer

    // Destroy existing instance
    if (viewerInstance) {
      try {
        viewerInstance.destroy()
      } catch (error) {
        // Ignore destroy errors
      }
    }
    
    detachGuards()

    // Create new viewer instance
    viewerInstance = new ViewerClass(galleryContainer, {
      toolbar: true,
      navbar: true,
      title: true,
      tooltip: true,
      backdrop: true, // Use true instead of 'static' to allow clicking outside
      zIndex: 200000, // Ensure it's above app drawers/modals
      zIndexInline: 200000,
      container: document.body, // Render overlay at body level to escape parent stacking/handlers
      // Ensure viewer UI elements are clickable and above all modals
      viewed() {
        // After viewer is shown, ensure all viewer elements are above modals
        // Use nextTick to ensure DOM is fully rendered
        nextTick(() => {
          if (viewerInstance?.viewer) {
            const viewerEl = viewerInstance.viewer as HTMLElement
            if (viewerEl) {
              // Set z-index on the main viewer container
              viewerEl.style.zIndex = '200000'
              viewerEl.style.position = 'fixed'
              
              // Ensure all child elements (toolbar, navbar, close button) are also above
              const allViewerElements = viewerEl.querySelectorAll('*')
              allViewerElements.forEach((el) => {
                const htmlEl = el as HTMLElement
                if (htmlEl && htmlEl.style) {
                  // Force z-index on all viewer UI elements
                  htmlEl.style.zIndex = '200001'
                  // Ensure pointer events work
                  htmlEl.style.pointerEvents = 'auto'
                }
              })
              
              // Also check for viewer backdrop and ensure it's above modals
              const backdrop = document.querySelector('.viewer-backdrop') as HTMLElement
              if (backdrop) {
                backdrop.style.zIndex = '199999'
              }
            }
          }
        })
      },
      hidden() {
        detachGuards()
        try {
          viewerInstance?.destroy()
        } catch (error) {
          // Ignore destroy errors
        }
        viewerInstance = null
        isViewerActive.value = false
        galleryImages.value = []
        // Restore body scroll
        if (prevBodyOverflow !== null) {
          document.body.style.overflow = prevBodyOverflow
          prevBodyOverflow = null
        }
        if (tempGalleryContainer) {
          try {
            tempGalleryContainer.remove()
          } catch {}
          tempGalleryContainer = null
        }
      },
    })

    attachGuards()

    // Open viewer at target index
    try {
      viewerInstance.view(targetIndex)
      isViewerActive.value = true
      // Lock body scroll to prevent scroll bleed to drawers/modals
      if (prevBodyOverflow === null) {
        prevBodyOverflow = document.body.style.overflow || ''
        document.body.style.overflow = 'hidden'
      }
      // Contain overscroll to prevent bounce/propagation on some browsers
      ;(document.documentElement as HTMLElement).style.overscrollBehavior = 'contain'
      document.body.style.overscrollBehavior = 'contain'
    } catch (error) {
      console.error('[useImageViewer] Failed to open viewer:', error)
      detachGuards()
      isViewerActive.value = false
    }
  }

  const attachGuards = () => {
    if (!viewerInstance?.viewer) return
    
    // First detach any existing guards
    detachGuards()
    
    // No click interception to ensure viewer internal controls (including close button) work correctly
    viewerEventHandlers = []

    // Prevent scroll from bleeding to underlying drawers (wheel/touchmove)
    viewerScrollGuards = viewerScrollEvents.map((type) => {
      const handler = (event: Event) => {
        const target = event.target as HTMLElement
        if (target && viewerInstance?.viewer?.contains?.(target)) {
          // Prevent default scrolling and stop propagation in capture phase
          try {
            // passive must be false to call preventDefault
            event.preventDefault()
          } catch {}
          event.stopPropagation()
        }
      }
      viewerInstance.viewer.addEventListener(type, handler, { capture: true, passive: false } as any)
      return { type, handler }
    })

    // Handle Escape key
    viewerEscapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isViewerActive.value) {
        // Only handle if viewer is active and event originated from viewer
        const target = event.target as HTMLElement
        if (viewerInstance?.viewer?.contains?.(target) || document.activeElement === document.body) {
          event.stopPropagation()
          event.stopImmediatePropagation?.()
          event.preventDefault()
          try {
            viewerInstance?.hide()
          } catch (error) {
            // Ignore hide errors
          }
        }
      }
    }

    document.addEventListener('keydown', viewerEscapeHandler, true)

    // Block global scroll outside the viewer while active
    const blockIfOutsideViewer = (event: Event) => {
      if (!isViewerActive.value || !viewerInstance?.viewer) return
      const target = event.target as HTMLElement
      const insideViewer = viewerInstance.viewer.contains(target)
      // Only intercept events that originate outside the viewer
      if (!insideViewer) {
        try {
          event.preventDefault()
        } catch {}
        event.stopPropagation()
      }
    }
    globalScrollBlockers = [
      { type: 'wheel', handler: blockIfOutsideViewer },
      { type: 'touchmove', handler: blockIfOutsideViewer },
    ]
    globalScrollBlockers.forEach(({ type, handler }) => {
      document.addEventListener(type, handler, { capture: true, passive: false } as any)
    })

    // Prevent underlying modals from intercepting clicks inside the viewer
    // Strategy: Only intercept clicks that are clearly on modal backdrops, not on viewer elements
    // This allows viewer's internal handlers (close button, etc.) to work normally
    const swallowIfInsideViewer = (event: Event) => {
      if (!isViewerActive.value || !viewerInstance?.viewer) return
      const target = event.target as HTMLElement
      if (!target) return
      
      // First, check if click is inside viewer container or any viewer UI element
      const insideViewer = viewerInstance.viewer.contains(target)
      const isViewerElement = target.closest('.viewer-container') || 
                              target.closest('.viewer-toolbar') ||
                              target.closest('.viewer-navbar') ||
                              target.closest('.viewer-close') ||
                              target.closest('[class*="viewer-"]')
      
      // If click is inside viewer, do NOT intercept - let viewer handle it completely
      if (insideViewer || isViewerElement) {
        // Don't stop propagation here - allow viewer's handlers to run normally
        // The high z-index should ensure viewer is on top and receives the click
        return
      }
      
      // Only intercept clicks that are clearly on modal backdrop elements
      // Check if target is a modal backdrop (but not viewer)
      const modalElement = target.closest('[role="dialog"]') || 
                          target.closest('[data-modal]') ||
                          (target.classList.contains('modal-backdrop') ? target : null)
      
      if (modalElement && !insideViewer && !isViewerElement) {
        // Click is on modal backdrop - stop propagation to prevent modal from closing
        // But only if it's not inside viewer
        event.stopPropagation()
      }
    }
    
    // Attach in bubble phase (false) to allow viewer handlers to run first
    // This ensures viewer's close button handlers execute before we intercept
    document.addEventListener('click', swallowIfInsideViewer, false)
    globalScrollBlockers.push({ type: 'click', handler: swallowIfInsideViewer })

    // Block keyboard-based scrolling (Space/PageUp/PageDown/Arrow keys) outside viewer
    const scrollKeys = new Set([' ', 'Spacebar', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'])
    const keyScrollBlocker = (event: KeyboardEvent) => {
      if (!isViewerActive.value || !viewerInstance?.viewer) return
      if (!scrollKeys.has(event.key)) return
      const target = event.target as HTMLElement
      const insideViewer = viewerInstance.viewer.contains(target)
      if (!insideViewer) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    document.addEventListener('keydown', keyScrollBlocker, true)
    globalScrollBlockers.push({ type: 'keydown', handler: keyScrollBlocker as any })
  }

  const detachGuards = () => {
    if (viewerInstance?.viewer) {
      viewerEventHandlers.forEach(({ type, handler }) => {
        try {
          viewerInstance.viewer.removeEventListener(type, handler, true)
        } catch (error) {
          // Ignore removeEventListener errors
        }
      })
      viewerScrollGuards.forEach(({ type, handler }) => {
        try {
          viewerInstance.viewer.removeEventListener(type, handler, true)
        } catch (error) {
          // Ignore removeEventListener errors
        }
      })
    }
    
    if (viewerEscapeHandler) {
      document.removeEventListener('keydown', viewerEscapeHandler, true)
      viewerEscapeHandler = null
    }
    if (globalScrollBlockers.length) {
      globalScrollBlockers.forEach(({ type, handler }) => {
        try {
          document.removeEventListener(type, handler, true as any)
        } catch {}
      })
      globalScrollBlockers = []
    }
    // restore overscroll behavior
    ;(document.documentElement as HTMLElement).style.overscrollBehavior = ''
    document.body.style.overscrollBehavior = ''
    
    viewerEventHandlers = []
    viewerScrollGuards = []
    isViewerActive.value = false
  }

  const closeViewer = () => {
    if (viewerInstance) {
      try {
        viewerInstance.hide()
      } catch (error) {
        // If hide fails, destroy directly
        try {
          viewerInstance.destroy()
        } catch (destroyError) {
          // Ignore destroy errors
        }
        viewerInstance = null
        isViewerActive.value = false
        galleryImages.value = []
        if (prevBodyOverflow !== null) {
          document.body.style.overflow = prevBodyOverflow
          prevBodyOverflow = null
        }
        ;(document.documentElement as HTMLElement).style.overscrollBehavior = ''
        document.body.style.overscrollBehavior = ''
      }
    }
  }

  const destroyViewer = () => {
    detachGuards()
    if (viewerInstance) {
      try {
        viewerInstance.destroy()
      } catch (error) {
        // Ignore destroy errors
      }
      viewerInstance = null
    }
    isViewerActive.value = false
    galleryImages.value = []
    if (prevBodyOverflow !== null) {
      document.body.style.overflow = prevBodyOverflow
      prevBodyOverflow = null
    }
    ;(document.documentElement as HTMLElement).style.overscrollBehavior = ''
    document.body.style.overscrollBehavior = ''
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    destroyViewer()
  })

  return {
    galleryImages,
    attachmentGalleryRef,
    isViewerActive,
    isImageAttachment,
    getAttachmentIcon,
    openViewer,
    closeViewer,
    destroyViewer,
  }
}

