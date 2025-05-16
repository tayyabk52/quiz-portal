# Admin Guide: Adding Quiz Questions with Google Drive Images

This guide provides step-by-step instructions for administrators on how to add quiz questions with images using Google Drive in the Quiz Portal.

## Accessing the Admin Panel

1. Log in to the Quiz Portal with your admin account (email must contain "admin")
2. After logging in, navigate to `/admin` in your browser
3. You should see the Admin Dashboard with "Manage Questions" and "View Results" tabs

## Adding a Question with Image

### Step 1: Prepare Your Image in Google Drive

1. Upload your image to Google Drive
2. Right-click on the image and select "Share"
3. Click on "Get link"
4. Change permission to "Anyone with the link" with "Viewer" access
5. Click "Copy link" to copy the sharing URL

### Step 2: Add a New Question

1. In the Admin Dashboard, select the "Manage Questions" tab
2. Fill in the question details:
   - **Question**: Enter your question text
   - **Options**: Fill in all four answer options
   - **Correct Answer**: Select which option is the correct answer
   - **Time Limit**: Set the time limit in seconds for this question
   - **Image URL**: Paste your Google Drive sharing link

3. Click "Add Question" to save the question

## Supported Google Drive Link Formats

The system can handle different types of Google Drive links:

1. Regular sharing link:
   ```
   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
   ```

2. Open URL format:
   ```
   https://drive.google.com/open?id=FILE_ID
   ```

The system will automatically convert these into directly viewable image URLs.

## Managing Questions

### Editing a Question

1. In the "Manage Questions" tab, find the question you want to edit
2. Click the "Edit" button next to the question
3. Make your changes in the edit form
4. Click "Save Changes" to update the question

### Deleting a Question

1. In the "Manage Questions" tab, find the question you want to delete
2. Click the "Delete" button next to the question
3. Confirm the deletion when prompted

## Best Practices for Question Images

1. **Image Size**: Keep images under 1MB for faster loading
2. **Dimensions**: Aim for 800-1200px width for optimal display
3. **Format**: Use JPEG or PNG format
4. **Content**: Ensure images are clearly visible and relevant to the question
5. **Accessibility**: Include questions that can be answered even if the image fails to load

## Viewing Quiz Results

1. In the Admin Dashboard, select the "View Results" tab
2. You'll see a list of all quiz attempts by students, including:
   - Student email
   - Score percentage
   - Completion date/time
   - Number of correct answers

3. Click "View Details" on any result to see the full breakdown of answers

## Troubleshooting

### Image Not Displaying in Preview

If your image doesn't appear in the preview when adding a question:

1. Verify the sharing settings in Google Drive
2. Make sure you've selected "Anyone with the link" can view
3. Try copying the link again
4. Check that the URL format is correct (starts with https://drive.google.com/)

### Question Not Saving

If you're having trouble saving a question:

1. Ensure all required fields are filled out
2. Check your internet connection
3. Try refreshing the page and adding the question again

## Need Help?

If you encounter any issues with the Admin panel:

1. Check the browser console for error messages (F12 > Console)
2. Verify your Firebase connection
3. Contact technical support with error details

---

Remember, well-crafted questions with clear images enhance the learning experience for students and provide more effective assessment.
