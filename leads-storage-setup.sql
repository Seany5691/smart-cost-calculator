-- Lead Attachments Storage Bucket Setup
-- This file contains the SQL commands to set up the storage bucket and policies
-- Run this AFTER creating the bucket in Supabase Dashboard

-- ============================================================================
-- STORAGE BUCKET CREATION
-- ============================================================================

-- Create the storage bucket (run this via Supabase Dashboard or Management API)
-- Bucket name: lead-attachments
-- Settings:
--   - Public: false (private bucket)
--   - File size limit: 52428800 (50MB)
--   - Allowed MIME types: 
--     * image/jpeg
--     * image/png
--     * image/gif
--     * image/webp
--     * application/pdf
--     * application/msword
--     * application/vnd.openxmlformats-officedocument.wordprocessingml.document
--     * application/vnd.ms-excel
--     * application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
--     * text/plain
--     * text/csv

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Policy 1: Users can upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'lead-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can view files in their own folder
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'lead-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can update files in their own folder
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'lead-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'lead-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete files in their own folder
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'lead-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'lead-attachments';

-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================================================
-- MANUAL SETUP INSTRUCTIONS
-- ============================================================================

/*
If you prefer to set up the bucket manually via Supabase Dashboard:

1. Go to Storage in Supabase Dashboard
2. Click "Create a new bucket"
3. Name: lead-attachments
4. Set as Private (uncheck "Public bucket")
5. Click "Create bucket"
6. Click on the bucket name
7. Go to "Policies" tab
8. Run the policy SQL commands above in the SQL Editor

File Structure:
- lead-attachments/
  - {user_id}/
    - {lead_id}/
      - {filename}

Example:
- lead-attachments/
  - 123e4567-e89b-12d3-a456-426614174000/
    - 456e7890-e89b-12d3-a456-426614174001/
      - invoice.pdf
      - photo.jpg
*/

-- Success message
SELECT 'Storage bucket setup complete!' as status,
       'Bucket: lead-attachments' as bucket,
       'Policies: 4 policies created for user isolation' as policies,
       'Users can only access files in their own folder' as security;
