export async function readApiJson<T>(response: Response): Promise<T> {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`Server belum memberikan respons aplikasi (HTTP ${response.status}). Muat ulang halaman; jika berulang, hubungi pengawas.`);
  }
  try { return await response.json() as T; }
  catch { throw new Error('Respons server tidak lengkap. Silakan coba lagi.'); }
}
