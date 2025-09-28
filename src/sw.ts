export async function registerSw() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported in this browser/environment')
    return
  }

  try {
    await new Promise<void>((resolve) => {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        resolve()
      }
      else {
        window.addEventListener('load', () => resolve(), { once: true })
      }
    })

    const registration = await navigator.serviceWorker.register('./sw.js', {
      scope: '/',
    })

    console.log('Editor sw registered', registration)
  }
  catch (err) {
    console.error('Editor sw registration failed', err)
  }
}
