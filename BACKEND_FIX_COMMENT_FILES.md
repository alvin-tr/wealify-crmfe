# Backend Fix: Upload Files for Task Comments

## Vấn đề
Backend controller `addComment` có nhận files qua `@UploadedFiles()` nhưng không xử lý chúng. Cần sửa để upload files và lưu vào `comment_files` table.

## File cần sửa
`crm-server/src/tasks/tasks.controller.ts`

## Sửa đổi cần thiết

### 1. Sửa method `addComment` trong controller:

Tìm method này (khoảng line 516-559):

```typescript
@Post(':id/comments')
@UseInterceptors(
  FilesInterceptor('files', 10, {
    storage: memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, // 20 MB
    },
  }),
)
async addComment(
  @Param('id', ParseIntPipe) taskId: number,
  @Body() dto: CreateCommentDto,
  @CurrentUser() user: AuthenticatedUser,
  @UploadedFiles() files?: UploadedTaskFile[],
) {
  try {
    if (!user || !user.id) {
      throw new HttpException(
        {
          success: false,
          message: 'User not authenticated',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.tasksService.addComment(taskId, dto, user.id);
    
    // TODO: Upload files to DigitalOcean Spaces and add to comment_files
    // This will be implemented similar to customer-interactions

    const comment = (await this.tasksService.getTaskComments(taskId)).find(
      (c) => c.id === result.id,
    );

    return {
      success: true,
      data: comment,
    };
  } catch (error) {
    // ... error handling
  }
}
```

**Thay thế bằng:**

```typescript
@Post(':id/comments')
@UseInterceptors(
  FilesInterceptor('files', 10, {
    storage: memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, // 20 MB
    },
  }),
)
async addComment(
  @Param('id', ParseIntPipe) taskId: number,
  @Body() dto: CreateCommentDto,
  @CurrentUser() user: AuthenticatedUser,
  @UploadedFiles() files?: UploadedTaskFile[],
) {
  try {
    if (!user || !user.id) {
      throw new HttpException(
        {
          success: false,
          message: 'User not authenticated',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.tasksService.addComment(taskId, dto, user.id, files || []);
    
    const comment = (await this.tasksService.getTaskComments(taskId)).find(
      (c) => c.id === result.id,
    );

    return {
      success: true,
      data: comment,
    };
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    this.logger.error(`Error adding comment: ${error.message}`, error.stack);
    throw new HttpException(
      {
        success: false,
        message: (error as Error).message ?? 'Failed to add comment',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
```

### 2. Sửa method `addComment` trong service:

Tìm method này trong `crm-server/src/tasks/tasks.service.ts` (khoảng line 551-559):

```typescript
async addComment(taskId: number, dto: CreateCommentDto, userId: number): Promise<{ id: number }> {
  const sql = `
    INSERT INTO task_comments (task_id, user_id, content)
    VALUES (?, ?, ?)
  `;

  const result: any = await this.writeDb.query(sql, [taskId, userId, dto.content || null]);
  return { id: result.insertId };
}
```

**Thay thế bằng:**

```typescript
async addComment(
  taskId: number,
  dto: CreateCommentDto,
  userId: number,
  files: Array<{ buffer: Buffer; mimetype?: string; originalname?: string; size?: number }> = [],
): Promise<{ id: number }> {
  try {
    return await this.writeDb.transaction(async (connection) => {
      // Create comment
      const sql = `
        INSERT INTO task_comments (task_id, user_id, content)
        VALUES (?, ?, ?)
      `;

      const result: any = await connection.query(sql, [taskId, userId, dto.content || null]);
      const commentId = result.insertId;

      // Upload and save files
      const filesToProcess = Array.isArray(files) ? files : files ? [files] : [];
      this.logger.log(`Comment ${commentId}: Processing ${filesToProcess.length} file(s)`);

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        try {
          this.logger.log(
            `Processing comment file ${i + 1}/${filesToProcess.length}: originalname=${file?.originalname}, mimetype=${file?.mimetype}, size=${file?.size}, hasBuffer=${!!file?.buffer}, bufferLength=${file?.buffer?.length || 0}`,
          );

          if (!file || !file.buffer?.length) {
            this.logger.warn(`Skipping comment file ${i + 1}: no buffer or empty buffer`);
            continue;
          }

          const key = this.buildCommentObjectKey(commentId, file.originalname ?? 'attachment');
          this.logger.log(`Uploading comment file to Spaces with key: ${key}`);

          await this.uploadToSpaces(key, file);
          this.logger.log(`Comment file uploaded successfully to Spaces`);

          const fileUrl = this.buildPublicUrl(key);
          this.logger.log(`Comment file URL: ${fileUrl}`);

          const [fileInsertResult] = await connection.execute<ResultSetHeader>(
            `
              INSERT INTO comment_files (comment_id, url, file_name, file_type, file_size)
              VALUES (?, ?, ?, ?, ?)
            `,
            [
              commentId,
              fileUrl,
              file.originalname || null,
              file.mimetype || null,
              file.size || null,
            ],
          );

          this.logger.log(
            `Comment file saved to database with ID: ${fileInsertResult.insertId}, commentId: ${commentId}`,
          );
        } catch (fileError) {
          this.logger.error(
            `Error processing comment file ${i + 1} (${file?.originalname || 'unknown'}): ${(fileError as Error).message}`,
            (fileError as Error).stack,
          );
          // Re-throw to rollback transaction
          throw fileError;
        }
      }

      this.logger.log(`Finished processing ${filesToProcess.length} files for comment ${commentId}`);

      return { id: commentId };
    });
  } catch (error) {
    this.logger.error(
      `Error in addComment transaction: ${(error as Error).message}`,
      (error as Error).stack,
    );
    throw error;
  }
}
```

### 3. Thêm helper method `buildCommentObjectKey` trong service:

Thêm method này vào `tasks.service.ts` (sau method `buildObjectKey`):

```typescript
/**
 * Build object key for comment file upload to DigitalOcean Spaces.
 */
private buildCommentObjectKey(commentId: number, originalName: string): string {
  const normalized =
    originalName
      ?.normalize('NFKD')
      .replace(/[^\w.\-]+/g, '-')
      .replace(/-+/g, '-') ?? 'attachment';
  const extension = extname(normalized).toLowerCase();
  const baseName = extension ? normalized.slice(0, -extension.length) : normalized;

  return `${this.spacesKeyPrefix}/comments/${commentId}/${Date.now()}-${randomUUID()}-${baseName || 'attachment'}${extension}`;
}
```

### 4. Sửa method `getTaskComments` trong controller để include files:

Tìm method `getTaskComments` trong controller (khoảng line 474-502) và đảm bảo nó đã include files:

```typescript
@Get(':id/comments')
async getTaskComments(@Param('id', ParseIntPipe) id: number) {
  try {
    const comments = await this.tasksService.getTaskComments(id);
    
    // Get files for each comment
    const commentsWithFiles = await Promise.all(
      comments.map(async (comment) => {
        const files = await this.tasksService.getCommentFiles(comment.id!);
        return { ...comment, files };
      }),
    );

    return {
      success: true,
      data: commentsWithFiles,
      count: commentsWithFiles.length,
    };
  } catch (error) {
    // ... error handling
  }
}
```

## Kiểm tra

Sau khi sửa:
1. Tạo một task
2. Thêm comment với file đính kèm
3. Kiểm tra database table `comment_files` có bản ghi mới
4. Kiểm tra comment có hiển thị files trong frontend

