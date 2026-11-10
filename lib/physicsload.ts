import { physicsLoaded } from './physics';

/*
 * The physics engine fetched (Rapier, WebAssembly): in a module of its own, imported only where a
 * scene plays (the studio, the play-ahead worker), so what the server builds (the assistant's
 * tools evaluate scenes too) does not take in its WebAssembly.
 */

let loading: Promise<void> | null = null;

/** Load the physics engine (once); resolves when it is ready. */
export function loadPhysics(): Promise<void> {
  loading ??= import('@dimforge/rapier3d').then(physicsLoaded);
  return loading;
}
