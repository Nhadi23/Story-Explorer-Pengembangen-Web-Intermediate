export const showLoading = () => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'flex';
};

export const hideLoading = () => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';
};

export const showError = (message) => {
  alert(message);
};

export const showSuccess = (message) => {
  alert(message);
};

export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};