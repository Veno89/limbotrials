export const RETURN_TO_SITE_EVENT = 'limbo:return-site';

export function requestReturnToSite(): void {
  window.dispatchEvent(new Event(RETURN_TO_SITE_EVENT));
}
