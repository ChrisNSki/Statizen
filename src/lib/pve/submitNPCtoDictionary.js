import { loadSettings } from '../settings/settingsUtil.js';

export async function submitNPCtoDictionary(npcClass) {
  const settings = await loadSettings();

  if (settings.allowDictionarySubmit) {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    const raw = JSON.stringify({
      data: {
        className: npcClass,
      },
    });

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };

    fetch('https://us-central1-statizen-dictionary-a1375.cloudfunctions.net/addNPCClass', requestOptions)
      .then((response) => response.text())
      .catch((error) => console.error(error));
  } else {
    return null;
  }
}
