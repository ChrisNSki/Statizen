import { loadSettings } from '../settings/settingsUtil.js';

export async function submitWeaponToDictionary(weaponClass) {
  const settings = await loadSettings();

  if (settings.allowDictionarySubmit) {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    const raw = JSON.stringify({
      data: {
        className: weaponClass,
      },
    });

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };

    fetch('https://addweaponclass-c4nz72522q-uc.a.run.app', requestOptions)
      .then((response) => response.text())
      .catch((error) => console.error(error));
  } else {
    return null;
  }
}
