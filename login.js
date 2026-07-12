// Get the HTML elements
const loginButton = document.getElementById('loginButton');
const loginForm = document.getElementById('loginForm');
const closeButton = document.getElementById('closeForm');
const loginFormActual = document.getElementById('login-form-actual'); // Get the actual form by its ID

loginButton.addEventListener('click', () => {
    loginForm.style.display = 'flex';

    setTimeout(() => {
        loginForm.classList.add('show-form');
    }, 10);
});

closeButton.addEventListener('click', () => {
    loginForm.classList.remove('show-form');

    setTimeout(() => {
        loginForm.style.display = 'none';
    }, 500); 
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