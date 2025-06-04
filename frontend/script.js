const form = document.getElementById('form');
const result = document.getElementById('result');
const input = document.getElementById('longUrl');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const longUrl = input.value.trim();
  if (!longUrl) return;

  result.textContent = 'Working...';

  try {
    const response = await fetch('/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ longUrl }),
    });
    const data = await response.json();

    if (response.ok && data.shortUrl) {
      result.innerHTML = `Shortened URL: <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>`;
      input.value = '';
    } else {
      result.textContent = 'Error: ' + (data.error || 'Something went wrong');
    }
  } catch (err) {
    result.textContent = 'Network error. Please try again.';
  }
});
