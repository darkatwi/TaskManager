const registrationForm = document.getElementById('registrationForm');

registrationForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(registrationForm);
  const email = formData.get('email');
  const password = formData.get('password');

  const userData = {
    email,      
    password,
  };

  try {
    const response = await fetch('http://localhost:5000/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok) {
      alert('Registration successful! Please login.');
      window.location.href = 'login.html';
    } else {
      alert('Registration failed: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});
