// Utility function to convert first letter to uppercase and the rest to lowercase

export function toUpperCase(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Utility function to convert first letter to uppercase and the rest to lowercase
export function toProperCase(str) {
  return str?.replace(/\w\S*/g, txt => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}
