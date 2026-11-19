import * as THREE from 'three';
import { buildChinookHelicopter, buildPerson, animatePerson } from '../rendering/realistic-vehicles.js';

// Evacuation Chapter: Operation Skyfall
// 1. Far background: fleet of Chinook helicopters lifting off into the distance and escaping off-screen.
// 2. Foreground: heavy-lift Chinook landing, crowds streaming in with baby crying & crowd murmurs.
// 3. School shield engaged with banner notification.
// 4. Takeoff & escort off-screen with meteors targeting the ascending chopper.
// 5. Spectacular non-fatal crash: fuselage stays intact, passengers stream out on foot safely, score penalty.
// 6. Fire suppression between choppers: dragon directed to put out blazes while next chopper is loaded.

export function createEvacuationChapter({
  scene,
  message,
  sound,
  ignite,
  flashAt,
  emitImpact,
  onComplete,
  onChopperEscaped,
  onChopperCrashed,
  spawnEscortThreat
}) {
  let active = false;
  let isSecondary = false;
  let currentRun = 1; // 1 to 4
  const TOTAL_RUNS = 4;
  let phase = 'idle'; // 'idle', 'loading', 'escort', 'crashed', 'fires', 'complete'
  let phaseTimer = 0;
  let totalEscaped = 0;
  let totalCrashed = 0;
  let escortThreatTimer = 1.0;

  // Foreground Chinook
  const foregroundRoot = new THREE.Group();
  foregroundRoot.visible = false;
  scene.add(foregroundRoot);
  const foregroundChinook = buildChinookHelicopter(THREE, foregroundRoot);

  // Civilians boarding group
  const civilianGroup = new THREE.Group();
  civilianGroup.visible = false;
  scene.add(civilianGroup);
  const civilians = [];
  for (let i = 0; i < 14; i++) {
    const person = buildPerson(THREE, i);
    civilianGroup.add(person);
    civilians.push({
      mesh: person,
      startX: (i % 2 === 0 ? -1 : 1) * (18 + Math.random() * 12),
      startZ: 20 + Math.random() * 8,
      targetX: -4.8, // ramp door
      targetZ: 18.0,
      speed: 3.5 + Math.random() * 2.0,
      progress: 0,
      boarded: false,
      escaping: false
    });
  }

  // Background Chinook Fleet (in skyline / far distance)
  const bgFleetGroup = new THREE.Group();
  bgFleetGroup.position.set(0, 0, -65);
  scene.add(bgFleetGroup);
  const bgChinooks = [];

  for (let i = 0; i < 4; i++) {
    const bgRoot = new THREE.Group();
    bgFleetGroup.add(bgRoot);
    const bgData = buildChinookHelicopter(THREE, bgRoot);
    bgRoot.scale.setScalar(0.28); // Far distance silhouette scale
    bgRoot.visible = false;
    bgChinooks.push({
      root: bgRoot,
      data: bgData,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      active: false,
      spool: 0
    });
  }

  // State tracking for the active foreground chopper
  let chopperPos = new THREE.Vector3(0, 1.0, 18.0);
  let chopperVel = new THREE.Vector3(0, 0, 0);
  let chopperHp = 100;
  let rotorSpeed = 0;
  let dir = 1; // 1 = flying right, -1 = flying left
  let smokeTimer = 0;

  function start() {
    active = true;
    currentRun = 1;
    totalEscaped = 0;
    totalCrashed = 0;
    startLoadingRun(1);
    spawnBackgroundFleet();
  }

  function spawnBackgroundFleet() {
    bgChinooks.forEach((bg, idx) => {
      bg.active = true;
      bg.root.visible = true;
      const startX = (idx - 1.5) * 55;
      bg.pos.set(startX, 24 + Math.random() * 14, -40 - idx * 18);
      bg.vel.set(
        (Math.random() - 0.5) * 4.0,
        4.5 + Math.random() * 2.5,
        -2.0 - Math.random() * 2.0
      );
      bg.root.position.copy(bg.pos);
      bg.spool = 14 + Math.random() * 6;
    });
  }

  function startLoadingRun(runNum, isSec = false) {
    currentRun = runNum;
    isSecondary = isSec;
    phase = 'loading';
    phaseTimer = 0;
    escortThreatTimer = 1.2;
    chopperHp = 100;
    dir = runNum % 2 === 1 ? 1 : -1;

    // Place Chinook on street
    chopperPos.set(dir > 0 ? -12.0 : 12.0, 1.0, 18.0);
    chopperVel.set(0, 0, 0);
    foregroundRoot.position.copy(chopperPos);
    foregroundRoot.rotation.set(0, dir > 0 ? 0 : Math.PI, 0);
    foregroundRoot.visible = true;
    foregroundChinook.rampDoor.rotation.z = -0.35; // open ramp
    rotorSpeed = 8.0; // idling rotors

    // Initialize civilians streaming to board
    civilianGroup.visible = true;
    civilians.forEach((c, i) => {
      c.progress = 0;
      c.boarded = false;
      c.escaping = false;
      c.startX = (dir > 0 ? -1 : 1) * (14 + i * 2.2);
      c.startZ = 22 + (i % 3) * 3;
      c.mesh.position.set(c.startX, 0.2, c.startZ);
      c.mesh.visible = true;
    });

    // Audio & Messages
    sound('evacuationAlert');
    sound('evacuationCrowd');
    sound('babyCry');
    if (isSec) {
      message(`⚠️ CIVILIAN TRANSPORT LOADING ON NORTH BROAD — ESCORT TO SAFETY! (SCHOOL SHIELD OFFLINE)`);
    } else {
      message(`🛡️ TECH FREIRE SHIELD ENGAGED! CHOPPER [${currentRun}/${TOTAL_RUNS}] LOADING — SECURE THE LZ!`);
    }
  }

  function startSecondaryEscort(runNum = 1) {
    if (active) return;
    active = true;
    isSecondary = true;
    currentRun = runNum;
    startLoadingRun(runNum, true);
  }

  function startTakeoff() {
    phase = 'escort';
    phaseTimer = 0;
    foregroundChinook.rampDoor.rotation.z = 0; // close ramp
    rotorSpeed = 24.0; // full power rotors
    chopperVel.set(dir * 13.5, 3.8, 0);
    civilianGroup.visible = false; // boarded inside

    sound('helicopter');
    sound('bonus');
    message(`🚁 ESCORT CHOPPER [${currentRun}/${TOTAL_RUNS}]! INTERCEPT INCOMING METEORS IN ITS FLIGHT PATH!`);
  }

  function crashChopper() {
    if (phase === 'crashed') return;
    phase = 'crashed';
    phaseTimer = 0;
    totalCrashed++;
    sound('crash');
    sound('evacuationCrowd');

    // Emergency autorotation hard touchdown on pavement
    chopperVel.set(dir * 4.0, -8.0, 0);

    // Fuselage stays intact! Emergency doors blow open and people stream out safely
    setTimeout(() => {
      chopperVel.set(0, 0, 0);
      chopperPos.y = 1.0;
      foregroundRoot.position.copy(chopperPos);
      foregroundChinook.rampDoor.rotation.z = -0.35; // ramp bursts open

      // Civilians stream out on foot safely to rowhouses
      civilianGroup.visible = true;
      civilians.forEach((c, i) => {
        c.mesh.position.copy(chopperPos).add(new THREE.Vector3(-4.8 * dir, 0, (Math.random() - 0.5) * 2));
        c.mesh.visible = true;
        c.escaping = true;
        c.targetX = (dir > 0 ? -1 : 1) * (25 + Math.random() * 15);
      });

      if (onChopperCrashed) onChopperCrashed(currentRun, isSecondary);
      if (isSecondary) {
        message(`⚠️ SECONDARY TRANSPORT DOWNED! SURVIVORS EVACUATED TO ROWHOUSES (-300 PTS)`);
      } else {
        message(`⚠️ CHOPPER DAMAGED! PASSENGERS EVACUATED SAFELY ON FOOT (-300 PTS)`);
      }
    }, 600);
  }

  function safeEscape() {
    phase = 'safe_escaped';
    phaseTimer = 0;
    totalEscaped++;
    foregroundRoot.visible = false;
    sound('bonus');
    sound('fanfare');

    if (onChopperEscaped) onChopperEscaped(currentRun, isSecondary);

    if (isSecondary) {
      active = false;
      message(`✅ SECONDARY TRANSPORT ESCAPED SAFELY! 45 CITIZENS RESCUED (+500 PTS)`);
    } else {
      message(`✅ CHOPPER [${currentRun}/${TOTAL_RUNS}] ESCAPED SAFELY! 45 CITIZENS RESCUED (+500 PTS)`);
      if (currentRun < TOTAL_RUNS) {
        startFiresPhase();
      } else {
        completeChapter();
      }
    }
  }

  function startFiresPhase() {
    phase = 'fires';
    phaseTimer = 0;

    // Ignite 2-3 secondary fires near the landing zone
    ignite(chopperPos.x + (Math.random() - 0.5) * 14, 3.2, 10);
    ignite(chopperPos.x + (Math.random() - 0.5) * 22, 1.2, 18);
    sound('fire');
    sound('siren');
    message(`🔥 PUT OUT FIRES TO SECURE THE LANDING ZONE FOR NEXT CHOPPER!`);
  }

  function completeChapter() {
    phase = 'complete';
    active = false;
    foregroundRoot.visible = false;
    civilianGroup.visible = false;
    sound('waveWin');
    sound('dragonRoar', { variant: 'challenge' });
    message(`🏆 MASS EVACUATION COMPLETE! NORTH BROAD NEIGHBORHOOD SECURED!`);
    if (onComplete) onComplete();
  }

  function update(dt, elapsed, meteors) {
    if (!active) return;

    // 1. Animate Foreground Chinook Tandem Rotors
    const spinSpeed = (rotorSpeed || 14.0) * dt;
    foregroundChinook.rotorFront.rotation.y += spinSpeed;
    foregroundChinook.rotorAft.rotation.y -= spinSpeed; // Contra-rotating

    // 2. Animate Background Fleet
    bgChinooks.forEach(bg => {
      if (!bg.active) return;
      bg.data.rotorFront.rotation.y += bg.spool * dt;
      bg.data.rotorAft.rotation.y -= bg.spool * dt;
      bg.pos.addScaledVector(bg.vel, dt);
      bg.root.position.copy(bg.pos);
      // Recycle once far off screen
      if (bg.pos.y > 90 || Math.abs(bg.pos.x) > 180) {
        bg.pos.y = 22 + Math.random() * 10;
        bg.pos.x = (Math.random() - 0.5) * 120;
      }
    });

    // 3. Evacuation Phase Machine
    phaseTimer += dt;

    // --- LOADING PHASE ---
    if (phase === 'loading') {
      // Animate civilians walking to the ramp
      civilians.forEach((c, i) => {
        if (!c.boarded) {
          c.progress += (c.speed * dt) / 12.0;
          c.mesh.position.x = THREE.MathUtils.lerp(c.startX, chopperPos.x + (dir > 0 ? -4.8 : 4.8), Math.min(1, c.progress));
          c.mesh.position.z = THREE.MathUtils.lerp(c.startZ, chopperPos.z, Math.min(1, c.progress));
          animatePerson(c.mesh, elapsed * 12.0 + i, true, false);
          if (c.progress >= 1.0) {
            c.boarded = true;
            c.mesh.visible = false;
          }
        }
      });

      // Periodic audio drama
      if (phaseTimer > 1.8 && phaseTimer < 2.0) sound('babyCry');

      if (phaseTimer >= 4.6) {
        startTakeoff();
      }
    }
    // --- ESCORT FLIGHT PHASE ---
    else if (phase === 'escort') {
      chopperPos.addScaledVector(chopperVel, dt);
      // Level off vertical ascent around Y=15
      if (chopperPos.y > 15.0) chopperVel.y = Math.max(0, chopperVel.y - dt * 2.5);
      foregroundRoot.position.copy(chopperPos);

      // Bank forward into flight direction
      foregroundRoot.rotation.z = -dir * 0.12;

      // Active threat spawning in flight path
      escortThreatTimer -= dt;
      if (escortThreatTimer <= 0 && spawnEscortThreat) {
        escortThreatTimer = 2.2 + Math.random() * 1.4;
        const leadDist = dir * (12 + Math.random() * 18);
        spawnEscortThreat(chopperPos.x + leadDist, Math.max(8, chopperPos.y + (Math.random() - 0.5) * 4), chopperPos.z);
      }

      // Check Meteor Collisions vs Escort Chinook
      if (meteors) {
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          if (m.grounded || !m.mesh) continue;
          const dist = m.mesh.position.distanceTo(chopperPos);
          if (dist < 4.8) {
            // Chinook hit by meteor!
            emitImpact(chopperPos.x, chopperPos.y, chopperPos.z, 85, 1.2);
            flashAt(chopperPos.x, chopperPos.y, chopperPos.z, 4.0);
            crashChopper();
            break;
          }
        }
      }

      // Check safe escape past board edge
      if (Math.abs(chopperPos.x) > 135.0) {
        safeEscape();
      }
    }
    // --- CRASHED PHASE (Emergency landing, people running away safely) ---
    else if (phase === 'crashed') {
      chopperPos.addScaledVector(chopperVel, dt);
      if (chopperPos.y <= 1.0) {
        chopperPos.y = 1.0;
        chopperVel.set(0, 0, 0);
      }
      foregroundRoot.position.copy(chopperPos);

      // Trailing black smoke from damaged rotor
      smokeTimer -= dt;
      if (smokeTimer <= 0) {
        smokeTimer = 0.12;
        flashAt(chopperPos.x + 3.8 * dir, chopperPos.y + 3.2, chopperPos.z, 0.4);
      }

      // Civilians running away safely on foot
      civilians.forEach((c, i) => {
        if (c.escaping) {
          c.mesh.position.x += dir * -4.5 * dt;
          animatePerson(c.mesh, elapsed * 14.0 + i, true, true);
        }
      });

      if (phaseTimer >= 5.5) {
        if (isSecondary) {
          active = false;
          foregroundRoot.visible = false;
          civilianGroup.visible = false;
        } else if (currentRun < TOTAL_RUNS) {
          startFiresPhase();
        } else {
          completeChapter();
        }
      }
    }
    // --- FIRES SUPPRESSION PHASE BETWEEN CHOPPERS ---
    else if (phase === 'fires') {
      if (phaseTimer >= 6.0) {
        startLoadingRun(currentRun + 1);
      }
    }
  }

  function reset() {
    active = false;
    isSecondary = false;
    phase = 'idle';
    phaseTimer = 0;
    currentRun = 1;
    totalEscaped = 0;
    totalCrashed = 0;
    escortThreatTimer = 1.0;
    foregroundRoot.visible = false;
    civilianGroup.visible = false;
    bgChinooks.forEach(bg => {
      bg.active = false;
      bg.root.visible = false;
    });
  }

  function getStats() {
    return {
      active,
      isSecondary,
      phase,
      currentRun,
      TOTAL_RUNS,
      totalEscaped,
      totalCrashed,
      chopperPos: chopperPos.toArray(),
      isShieldActive: active && !isSecondary && (phase === 'loading' || phase === 'escort')
    };
  }

  return {
    start,
    startSecondaryEscort,
    update,
    crashChopper,
    safeEscape,
    reset,
    isActive: () => active,
    isSecondaryActive: () => active && isSecondary,
    getStats,
    foregroundRoot,
    bgFleetGroup
  };
}
