# Kiểm tra tính năng Comment với Files

## ✅ Frontend - Đã hoạt động đúng

### 1. Gửi files khi tạo comment
- ✅ File: `composables/useTasks.ts` - Method `addComment`
- ✅ Tạo FormData và append files
- ✅ Xóa Content-Type header để browser tự set boundary
- ✅ Gửi files qua `formData.append('files', file)`

### 2. Hiển thị files trong comment
- ✅ File: `pages/tasks/index.vue` - Line 680-692
- ✅ Có code hiển thị `comment.files` với link download
- ✅ Interface `TaskComment` có property `files?: TaskFile[]`

### 3. Upload UI
- ✅ File: `pages/tasks/index.vue` - Line 610-658
- ✅ Có file upload input cho comment
- ✅ Có validation (max 10 files, 20MB each)
- ✅ Có hiển thị danh sách files đã chọn

## ⚠️ Backend - Cần kiểm tra

### 1. Controller (`tasks.controller.ts`)
Từ file đã attach, tôi thấy:
- ✅ Line 508-515: Có `FilesInterceptor` để nhận files
- ✅ Line 520: Có `@UploadedFiles() files?: UploadedTaskFile[]`
- ✅ Line 543: Có truyền `files || []` vào service: `this.tasksService.addComment(taskId, dto, user.id, files || [])`
- ✅ Line 479-485: Có code get files cho mỗi comment và return `commentsWithFiles`

**Kết luận**: Controller đã xử lý files đúng!

### 2. Service (`tasks.service.ts`)
Từ file đã attach, tôi thấy:
- ✅ Line 551-559: Method signature có nhận `files` parameter
- ✅ Line 562-637: Có logic upload files và lưu vào `comment_files` table
- ✅ Line 591: Có method `buildCommentFileObjectKey` để tạo key
- ✅ Line 691-694: Có method `getCommentFiles` để lấy files của comment

**Kết luận**: Service đã có code xử lý files!

## 🔍 Vấn đề có thể xảy ra

### 1. Interface không khớp
Frontend dùng `TaskFile[]` cho comment files, nhưng backend có `CommentFile` interface riêng. Cần kiểm tra:

```typescript
// Frontend: composables/useTasks.ts
export interface TaskComment {
  files?: TaskFile[]  // ❌ TaskFile có task_id, không phải comment_id
}

// Backend có CommentFile interface riêng
export interface CommentFile {
  id?: number;
  comment_id: number;  // ✅ Đúng
  url: string;
  file_name?: string | null;
  // ...
}
```

**Giải pháp**: Tạo interface riêng cho CommentFile hoặc dùng chung nhưng đảm bảo backend trả về đúng format.

### 2. Response parsing
Backend trả về `commentsWithFiles` với structure:
```typescript
{
  ...comment,
  files: CommentFile[]
}
```

Frontend cần đảm bảo parse đúng.

## 📝 Checklist để test

1. ✅ Frontend gửi files đúng format
2. ✅ Backend nhận files qua FilesInterceptor
3. ✅ Backend truyền files vào service
4. ✅ Service upload files lên Spaces
5. ✅ Service lưu files vào comment_files table
6. ✅ Backend trả về comments với files
7. ✅ Frontend hiển thị files trong comment

## 🐛 Debug steps

1. Mở browser DevTools → Network tab
2. Tạo comment với file
3. Kiểm tra request:
   - Method: POST
   - URL: `/tasks/:id/comments`
   - Content-Type: `multipart/form-data`
   - Body có field `files` với file data
4. Kiểm tra response:
   - Status: 200
   - Data có `files` array không?
5. Kiểm tra database:
   - Table `comment_files` có bản ghi mới không?
   - `comment_id` đúng không?
   - `url` có giá trị không?

## 🔧 Nếu vẫn không hoạt động

1. Kiểm tra backend logs xem có error không
2. Kiểm tra DigitalOcean Spaces có file được upload không
3. Kiểm tra database có bản ghi trong `comment_files` không
4. Kiểm tra response từ API có include files không

