export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) {
    const data = (await res.json()) as { message?: string };
    throw new Error(data.message ?? 'Upload failed');
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}
