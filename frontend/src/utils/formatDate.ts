
export function formatDate(isoDate: string): string {
  // Converte de AAAA-MM-DD ou data ISO para DD/MM/AAAA
  const date = new Date(isoDate);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const correctedDate = new Date(date.getTime() + userTimezoneOffset);
  
  const day = String(correctedDate.getDate()).padStart(2, '0');
  const month = String(correctedDate.getMonth() + 1).padStart(2, '0');
  const year = correctedDate.getFullYear();
  
  return `${day}/${month}/${year}`;
}