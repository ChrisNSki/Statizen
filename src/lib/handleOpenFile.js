import { open } from '@tauri-apps/plugin-dialog';

export async function handleOpenFile() {
  const selectedPath = await open({
    multiple: false,
    filters: [
      {
        name: 'Log Files',
        extensions: ['log'],
      },
    ],
  });

  if (selectedPath) {
    return selectedPath;
  }
}
