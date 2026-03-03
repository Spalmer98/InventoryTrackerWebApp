// Get references to the HTML elements
const fileInput = document.getElementById('fileInput'); // Image File
const imagePreview = document.getElementById('imagePreview'); // Image view
const itemName = document.getElementById('itemName'); // Name of item
const itemDescription = document.getElementById('itemDescription'); // Descrtiption of item
const itemLocation = document.getElementById('locations'); // Location of item


/**********************************
*
*  Image Preview Handling
*
***********************************/
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


/**********************************
*
*  Sumbit Button Handling
*
***********************************/

// Add new location option
function submit() {
  var input = document.getElementById('locations');
  var datalist = document.getElementById('locationsList');
  var val = input.value;

  // Check if option already exists
  var exists = false;
  for (var i = 0; i < datalist.options.length; i++) {
    if (datalist.options[i].value === val) {
      exists = true;
      break;
    }
  }

  // Add new option if it doesn't exist
  if (!exists && val !== "") {
    var option = document.createElement('option');
    option.value = val;
    datalist.appendChild(option);
    
    // Save to LocalStorage for persistence
    saveOption(val);
    
    input.value = ''; // Clear input
  }
}

// Function to save option to LocalStorage
function saveOption(value) {
  var existingOptions = JSON.parse(localStorage.getItem('myOptions')) || [];
  existingOptions.push(value);
  localStorage.setItem('myOptions', JSON.stringify(existingOptions));
}

// Function to load options on page load
window.onload = function() {
  var storedOptions = JSON.parse(localStorage.getItem('myOptions')) || [];
  var datalist = document.getElementById('items');
  storedOptions.forEach(function(item) {
    var option = document.createElement('option');
    option.value = item;
    datalist.appendChild(option);
  });
};

// Disable submit button until all entry places are filled
function enableSubmit() {
    let submitBtn = document.getElementById('submitBtn');

    // Check if the input field value is not empty
    if (itemName.value.trim() !== "" && itemLocation.value.trim() !== "") {
        submitBtn.disabled = false; // Enable the button
    } else {
        submitBtn.disabled = true; // Disable the button
    }
}

/**********************************
*
*  Database API handling
*
***********************************/
// Select the form element
const myForm = document.getElementById('entryForm');
const responseMessage = document.getElementById('responseMessage');

// Add an event listener for the submit event
myForm.addEventListener('submit', async function (event) {
    // Prevent the default form submission (page reload)
    event.preventDefault();

    // Collect the form data
    const formData = new FormData(this);
    
    // Optional: Convert FormData to a JSON object
    const data = Object.fromEntries(formData.entries());
    const jsonData = JSON.stringify(data); //

    // Define your backend API endpoint URL
    const apiEndpoint = 'postgresql://postgres:[YOUR-PASSWORD]@db.sfnxvbajlsjtrtjqfuge.supabase.co:5432/postgres'; // Replace with your actual endpoint

    try {
        // Send the data using the fetch API with a POST request
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' //
            },
            body: jsonData // Send the JSON data in the request body
        });

        // Handle the server's response
        if (response.ok) {
            const result = await response.json();
            responseMessage.textContent = 'Form submitted successfully!';
            responseMessage.style.color = 'green';
            console.log('Success:', result);
            this.reset(); // Reset form after successful submission
        } else {
            responseMessage.textContent = 'Form submission failed.';
            responseMessage.style.color = 'red';
            console.error('Submission error:', response.statusText);
        }
    } catch (error) {
        responseMessage.textContent = 'An error occurred. Please try again later.';
        responseMessage.style.color = 'red';
        console.error('Error:', error);
    }
});


/**********************************
*
*  Side Tab handling
*
***********************************/
// /* Set the width of the side navigation to 250px and the left margin of the page content to 250px and add a black background color to body */
// function openNav() {
//   document.getElementById("mySidenav").style.width = "250px";
//   document.getElementById("main").style.marginLeft = "250px";
//   document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
// }

// /* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */
// function closeNav() {
//   document.getElementById("mySidenav").style.width = "0";
//   document.getElementById("main").style.marginLeft = "0";
//   document.body.style.backgroundColor = "white";
// }