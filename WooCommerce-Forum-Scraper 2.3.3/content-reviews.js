// content-reviews.js
(function() {
  // Get all elements containing "Started by: "
  const startedByElements = Array.from(document.querySelectorAll('*'))
    .filter(el => el.textContent.includes('Started by: '));

  // Extract usernames using regex
  const usernames = startedByElements.map(el => {
    const match = el.textContent.match(/Started by: (\S+)/); // \S+ for non-whitespace
    return match ? match[1] : null;
  }).filter(Boolean);

  // Remove duplicates
  const uniqueUsernames = [...new Set(usernames)];

  // Prepare CSV content with header
  const csvContent = "Username\n" + uniqueUsernames.join('\n');

  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'usernames.csv';
  document.body.appendChild(a); // Required for Firefox
  a.click();
  document.body.removeChild(a); // Clean up
  URL.revokeObjectURL(url); // Free memory
})(); 