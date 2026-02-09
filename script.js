// Get references to the HTML elements
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');

// Add an event listener to the file input
fileInput.addEventListener('change', function(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        // Create a temporary URL for the selected file
        const imageUrl = URL.createObjectURL(file);

        // Set the src attribute of the image tag and show it
        imagePreview.src = imageUrl;
        imagePreview.style.display = 'block';

        // Optional: Free up memory when the image is loaded
        imagePreview.onload = function() {
            URL.revokeObjectURL(imageUrl); // Revoke the object URL after loading
        }
    } else {
        // Handle case where no file is selected (e.g., user cancels)
        imagePreview.style.display = 'none';
        imagePreview.src = '#';
    }
});
