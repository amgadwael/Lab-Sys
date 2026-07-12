// Get the HTML elements
const loginButton = document.getElementById('loginButton');
const loginForm = document.getElementById('loginForm');
const closeButton = document.getElementById('closeForm');
const loginFormActual = document.getElementById('login-form-actual'); // Get the actual form by its ID

// When the login button is clicked, show the form
loginButton.addEventListener('click', () => {
    // 1. First, make the container visible immediately.
    loginForm.style.display = 'flex';

    // 2. Then, after a tiny delay, add the 'show-form' class.
    // This delay is needed to ensure the CSS transition runs correctly.
    setTimeout(() => {
        loginForm.classList.add('show-form');
    }, 10);
});

// When the close button is clicked, hide the form with animation
closeButton.addEventListener('click', () => {
    // 1. Remove the 'show-form' class to start the fade-out animation.
    loginForm.classList.remove('show-form');

    // 2. Hide the container after the animation is finished (0.5 seconds).
    // This is important to allow the animation to complete before hiding the form.
    setTimeout(() => {
        loginForm.style.display = 'none';
    }, 500); // 500 milliseconds is the same as the transition duration in CSS
});

// --- Handle Form Submission and Redirection ---
loginFormActual.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent the default form submission (page reload)

    const passwordInput = document.getElementById('password').value;
    const correctPassword = '12345'; // Set your correct password here

    if (passwordInput === correctPassword) {
        // Correct password, redirect to the main page
        window.location.href = 'main.html'; // Assuming your main page is index.html
    } else {
        // Incorrect password, show an alert
        alert('كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.');
    }
});