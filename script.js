// Get references to the HTML elements (only present on entry page)
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
// Add an event listener to the file input (only on entry page)
if (fileInput && imagePreview) {
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
}


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

// Function to load options on page load (locationsList on entry page; entry.js also loads from Supabase)
window.onload = function() {
  var storedOptions = JSON.parse(localStorage.getItem('myOptions')) || [];
  var datalist = document.getElementById('locationsList');
  if (datalist) {
    storedOptions.forEach(function(item) {
      var option = document.createElement('option');
      option.value = item;
      datalist.appendChild(option);
    });
  }
};

// Disable submit button until all entry places are filled (optional; form uses required attributes too)
function enableSubmit() {
    let submitBtn = document.getElementById('submitBtn');
    if (!submitBtn || !itemName || !itemLocation) return;
    if (itemName.value.trim() !== "" && itemLocation.value.trim() !== "") {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

// Form submit is handled by entry.js (Supabase) on the entry page.


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