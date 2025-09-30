import axios from 'axios';
import { BASE_URL } from '@/config';

export const uploadImage = async (fileUri: string, folder: string) => {
  const formData = new FormData();
  const filename = fileUri.split('/').pop();
  
  // Infer the file type from the filename
  const match = /(\.\w+)$/.exec(filename || '');
  const type = match ? `image/${match[0].substring(1)}` : 'image';

  formData.append('file', {
    uri: fileUri,
    name: filename || 'image.jpg',
    type,
  } as any);

  formData.append('folder', folder);

  const response = await axios.post(
    `${BASE_URL}/api/v1/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};
