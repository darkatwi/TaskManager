const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = loginForm.email.value;
  const password = loginForm.password.value;

  const formData = new URLSearchParams();
  formData.append('email', email);
  formData.append('password', password);

  try {
    const response = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include', 
      body: formData.toString(),
    });

    if (!response.ok) {
      const errData = await response.json();
      alert('Login failed: ' + (errData.error || 'Unknown error'));
      return;
    }

    const data = await response.json();

    if (data.message === 'Logged in successfully') {
      localStorage.setItem('userId', data.user._id);
      localStorage.setItem('userEmail', data.user.email);

      fetch(`http://localhost:5000/api/collaborators/${data.user._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      }).catch(err => console.error('Failed to set status active:', err));

      alert('Welcome ' + data.user.email);
      window.location.href = 'http://127.0.0.1:5500/html/dashboard.html';
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

document.getElementById('googleLoginBtn').addEventListener('click', () => {
  window.location.href = 'http://localhost:5000/auth/google';
});
