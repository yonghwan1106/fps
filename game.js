import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- Game State ---
let camera, scene, renderer, composer, controls;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let isSprinting = false;
let isCrouching = false;
let baseSpeed = 150;
let standingHeight = 10;
let crouchingHeight = 5;
let currentHeight = 10;
let isMobileActive = false;
let joystickVector = { x: 0, y: 0 };
let touchLookId = null;
let touchLookLastX = 0;
let touchLookLastY = 0;


let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let bullets = [];
let enemies = [];
let enemyBullets = [];
let items = []; // Items array
let particles = [];
let lastShotTime = 0;
const SHOT_COOLDOWN = 150;

let score = 0;
let health = 100;
let ammo = 30;
let isGameOver = false;

// Juice Variables
let weapon;
let shakeIntensity = 0;
let recoilAmount = 0;

// --- ADS (Aim Down Sights) System ---
let isADS = false;
let defaultFOV = 75;
let currentFOV = 75;
let adsTransitionSpeed = 10;

// --- Weapon Slot System ---
let primaryWeaponIndex = 0;
let secondaryWeaponIndex = 7; // Volt Pistol
let currentSlot = "primary"; // "primary" or "secondary"

// --- Advanced Movement State ---
let isSliding = false;
let slideTimer = 0;
const SLIDE_DURATION = 0.6;
const SLIDE_SPEED = 350;
const SLIDE_COOLDOWN = 1.0;
let slideCooldownTimer = 0;
let slideDirection = new THREE.Vector3();

let dashCharges = 2;
let dashCooldownTimer = 0;
const DASH_COOLDOWN = 3.0;
const DASH_SPEED = 500;
const DASH_DURATION = 0.15;
let isDashing = false;
let dashTimer = 0;
let dashDirection = new THREE.Vector3();

let isWallRunning = false;
let wallRunSide = 0;
let wallRunTimer = 0;
const WALL_RUN_DURATION = 1.5;
const WALL_RUN_SPEED = 200;

// Movement State Machine
const MovementState = {
    IDLE: 'idle',
    WALKING: 'walking',
    SPRINTING: 'sprinting',
    CROUCHING: 'crouching',
    SLIDING: 'sliding',
    DASHING: 'dashing',
    JUMPING: 'jumping',
    WALL_RUNNING: 'wall_running',
    FALLING: 'falling'
};
let currentMovementState = MovementState.IDLE;

// --- Killstreak System ---
let currentKillstreak = 0;
let highestKillstreak = 0;
let activeBuffs = [];

const KILLSTREAKS = {
    3: { name: "Speed Boost", duration: 10, icon: "SPEED", color: 0x00ffff },
    5: { name: "Damage Amp", duration: 8, icon: "DMG", color: 0xff0000 },
    7: { name: "Shield", duration: 6, icon: "SHIELD", color: 0x00ff00 },
    10: { name: "Orbital Strike", duration: 0, icon: "ORBITAL", color: 0xffff00 },
    15: { name: "Neon Storm", duration: 12, icon: "STORM", color: 0xff00ff }
};

// Buff multipliers
let speedBuffMultiplier = 1.0;
let damageBuffMultiplier = 1.0;
let hasShield = false;
let shieldHealth = 0;

// --- Ability System ---
const ABILITIES = {
    blink: { name: "Blink", description: "Short-range teleport", cooldown: 8, key: "E" },
    overcharge: { name: "Overcharge", description: "Double fire rate for 5s", cooldown: 15, key: "E" },
    phase: { name: "Phase Shift", description: "Invulnerable for 2s", cooldown: 20, key: "E" },
    scanner: { name: "Threat Scanner", description: "Highlight enemies for 5s", cooldown: 12, key: "E" }
};

let selectedAbility = 'blink';
let abilityCooldownTimer = 0;
let isAbilityActive = false;
let abilityDuration = 0;

// --- Perk System ---
const PERKS = {
    quickReload: { name: "Quick Reload", description: "-30% reload time" },
    thickSkin: { name: "Thick Skin", description: "-15% damage taken" },
    deadEye: { name: "Dead Eye", description: "+25% headshot damage" },
    marathoner: { name: "Marathoner", description: "Unlimited sprint" },
    scavenger: { name: "Scavenger", description: "+50% ammo from pickups" },
    vampirism: { name: "Vampirism", description: "Kills restore 10 HP" },
    ninja: { name: "Ninja", description: "Silent movement, faster crouch" },
    heavyHitter: { name: "Heavy Hitter", description: "+10% base damage" }
};

let selectedPerks = ['quickReload', 'vampirism'];
let perkMultipliers = {
    reloadTime: 1.0,
    damageTaken: 1.0,
    headshotBonus: 1.0,
    ammoPickup: 1.0,
    baseDamage: 1.0,
    crouchSpeed: 1.0
};

// --- Game Mode System ---
const GameMode = {
    SURVIVAL: 'survival',
    WAVE: 'wave',
    TIME_ATTACK: 'time_attack'
};

let currentGameMode = GameMode.SURVIVAL;
let waveNumber = 0;
let enemiesRemainingInWave = 0;
let waveIntermission = false;
let intermissionTimer = 0;
let survivalTime = 0;
let timeAttackTimer = 120;
let targetScore = 5000;
let bonusKillCounter = 0;

// --- Weapon System ---
const WEAPONS = [
    // PRIMARY WEAPONS
    {
        name: "Pulse Rifle",
        category: "ar",
        damage: 22,
        fireRate: 100,
        spread: 0.025,
        adsSpread: 0.008,
        ammoCapacity: 30,
        reloadTime: 1500,
        color: 0x00ffff,
        range: 500,
        headshotMult: 1.5,
        slot: "primary"
    },
    {
        name: "Phantom AR",
        category: "ar",
        damage: 26,
        fireRate: 120,
        spread: 0.02,
        adsSpread: 0.005,
        ammoCapacity: 25,
        reloadTime: 1800,
        color: 0x00ff88,
        range: 600,
        headshotMult: 1.5,
        slot: "primary"
    },
    {
        name: "Viper SMG",
        category: "smg",
        damage: 14,
        fireRate: 50,
        spread: 0.08,
        adsSpread: 0.04,
        ammoCapacity: 35,
        reloadTime: 1200,
        color: 0xffaa00,
        range: 300,
        headshotMult: 1.3,
        slot: "primary"
    },
    {
        name: "Neon Shotgun",
        category: "shotgun",
        damage: 18,
        fireRate: 900,
        spread: 0.18,
        adsSpread: 0.12,
        ammoCapacity: 6,
        pelletCount: 8,
        reloadTime: 2500,
        color: 0xff0000,
        range: 150,
        headshotMult: 1.2,
        slot: "primary"
    },
    {
        name: "Ion Sniper",
        category: "sniper",
        damage: 150,
        fireRate: 1500,
        spread: 0.001,
        adsSpread: 0.0001,
        ammoCapacity: 5,
        reloadTime: 3000,
        color: 0xff00ff,
        range: 1000,
        headshotMult: 2.5,
        scopeZoom: 3.0,
        slot: "primary"
    },
    {
        name: "Plasma LMG",
        category: "lmg",
        damage: 18,
        fireRate: 80,
        spread: 0.06,
        adsSpread: 0.03,
        ammoCapacity: 100,
        reloadTime: 4000,
        color: 0x00ff00,
        range: 450,
        headshotMult: 1.3,
        movementPenalty: 0.7,
        slot: "primary"
    },
    {
        name: "Arc DMR",
        category: "dmr",
        damage: 55,
        fireRate: 400,
        spread: 0.01,
        adsSpread: 0.002,
        ammoCapacity: 15,
        reloadTime: 2000,
        color: 0x8800ff,
        range: 700,
        headshotMult: 2.0,
        slot: "primary"
    },
    // SECONDARY WEAPONS
    {
        name: "Volt Pistol",
        category: "pistol",
        damage: 35,
        fireRate: 300,
        spread: 0.03,
        adsSpread: 0.01,
        ammoCapacity: 12,
        reloadTime: 1000,
        color: 0xffffff,
        range: 400,
        headshotMult: 1.8,
        slot: "secondary"
    }
];

let currentWeaponIndex = 0;
let weaponState = {
    ...WEAPONS[0],
    currentAmmo: WEAPONS[0].ammoCapacity,
    isReloading: false,
    lastShotTime: 0
};


// --- Difficulty Settings ---
const DIFFICULTY_SETTINGS = {
    easy: { spawnRate: 3000, enemyHealthMult: 0.7, damageMult: 0.5 },
    normal: { spawnRate: 2000, enemyHealthMult: 1.0, damageMult: 1.0 },
    hard: { spawnRate: 1000, enemyHealthMult: 1.5, damageMult: 1.5 }
};

let currentDifficulty = 'normal';
let enemySpawnInterval;

// --- Enemy Classes ---
class Enemy {
    constructor(scene, position) {
        this.scene = scene;
        this.alive = true;

        // Default Stats
        this.health = 100;
        this.speed = 3.3;
        this.scoreValue = 100;
        this.damage = 10;

        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
    }

    createMesh() {
        // Base mesh
        const geometry = new THREE.BoxGeometry(10, 10, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        return new THREE.Mesh(geometry, material);
    }

    update(delta, playerPos) {
        // Base behavior: Chase player
        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        this.mesh.position.add(dir.multiplyScalar(this.speed * delta));
        this.mesh.lookAt(playerPos);
    }

    takeDamage(amount) {
        this.health -= amount;
        shakeIntensity += 0.1;
        // Hit flash
        this.mesh.material.color.offsetHSL(0, 0, 0.5);
        showHitMarker();
        setTimeout(() => {
            if (this.alive) this.resetColor();
        }, 50);

        if (this.health <= 0) this.die();
    }

    resetColor() {
        // To be overridden or handle base color
    }

    die() {
        this.alive = false;
        createExplosion(this.mesh.position, this.mesh.material.color);
        this.scene.remove(this.mesh);
        spawnItem(this.mesh.position); // Spawn item on death
        score += this.scoreValue;

        // Killstreak and game mode integration
        addKill();

        // Wave mode - track remaining enemies
        if (currentGameMode === GameMode.WAVE) {
            enemiesRemainingInWave--;
            if (enemiesRemainingInWave <= 0 && !waveIntermission) {
                completeWave();
            }
        }

        // Time Attack - bonus time for kills
        if (currentGameMode === GameMode.TIME_ATTACK) {
            bonusKillCounter++;
            if (bonusKillCounter >= 10) {
                timeAttackTimer += 5;
                bonusKillCounter = 0;
                alertMessage("+5 SECONDS!");
            }
        }

        updateHUD();
    }
}

class Charger extends Enemy {
    constructor(scene, position) {
        super(scene, position);
        this.health = 50;
        this.speed = 10;
        this.scoreValue = 50;
        this.mesh.material.color.setHex(0xff0000);
        this.baseColor = 0xff0000;
    }
    resetColor() { this.mesh.material.color.setHex(this.baseColor); }
}

class Tank extends Enemy {
    constructor(scene, position) {
        super(scene, position);
        this.health = 400;
        this.speed = 2.3;
        this.scoreValue = 300;
        this.mesh.scale.set(2, 2, 2);
        this.mesh.material.color.setHex(0x00ff00);
        this.baseColor = 0x00ff00;
    }
    resetColor() { this.mesh.material.color.setHex(this.baseColor); }
}

class Shooter extends Enemy {
    constructor(scene, position) {
        super(scene, position);
        this.health = 80;
        this.speed = 3.3;
        this.scoreValue = 150;
        this.mesh.material.color.setHex(0xff00ff);
        this.baseColor = 0xff00ff;

        this.shootCooldown = 2000;
        this.lastShootTime = performance.now();
    }

    resetColor() { this.mesh.material.color.setHex(this.baseColor); }

    update(delta, playerPos) {
        const dist = this.mesh.position.distanceTo(playerPos);
        this.mesh.lookAt(playerPos);

        // Keep distance
        if (dist > 60) {
            const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
            this.mesh.position.add(dir.multiplyScalar(this.speed * delta));
        } else if (dist < 40) {
            // Back away if too close
            const dir = new THREE.Vector3().subVectors(this.mesh.position, playerPos).normalize();
            this.mesh.position.add(dir.multiplyScalar(this.speed * delta));
        }

        // Shoot
        const now = performance.now();
        if (now - this.lastShootTime > this.shootCooldown) {
            this.shoot(playerPos);
            this.lastShootTime = now;
        }
    }

    shoot(playerPos) {
        const bulletGeo = new THREE.SphereGeometry(2, 8, 8);
        const bulletMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const bullet = new THREE.Mesh(bulletGeo, bulletMat);

        bullet.position.copy(this.mesh.position);

        // Predict player pos slightly? No, just aim at center for now
        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        bullet.velocity = dir.multiplyScalar(100); // Slower than player bullets
        bullet.life = 5.0; // Seconds

        this.scene.add(bullet);
        enemyBullets.push(bullet);
    }
}

// --- Boss Enemy ---
class BossEnemy extends Enemy {
    constructor(scene, position) {
        super(scene, position);
        this.health = 2000;
        this.maxHealth = 2000;
        this.speed = 4;
        this.scoreValue = 1000;
        this.damage = 25;
        this.mesh.scale.set(4, 4, 4);
        this.mesh.material.color.setHex(0xffff00);
        this.baseColor = 0xffff00;

        this.attackPatterns = ['charge', 'aoe', 'summon'];
        this.currentAttack = null;
        this.attackCooldown = 3000;
        this.lastAttackTime = performance.now();
        this.isCharging = false;
        this.chargeTarget = null;

        // Add boss indicator ring
        const ringGeo = new THREE.RingGeometry(18, 20, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
        this.ring = new THREE.Mesh(ringGeo, ringMat);
        this.ring.rotation.x = -Math.PI / 2;
        this.ring.position.y = 0.5;
        this.mesh.add(this.ring);

        playSound('bossSpawn');
        alertMessage("BOSS INCOMING!");
    }

    resetColor() { this.mesh.material.color.setHex(this.baseColor); }

    update(delta, playerPos) {
        // Rotate ring
        this.ring.rotation.z += delta * 2;

        const now = performance.now();

        if (this.isCharging && this.chargeTarget) {
            // Charge attack movement
            const dir = new THREE.Vector3().subVectors(this.chargeTarget, this.mesh.position);
            if (dir.length() > 5) {
                dir.normalize();
                this.mesh.position.add(dir.multiplyScalar(this.speed * 3 * delta));
            } else {
                this.isCharging = false;
                this.chargeTarget = null;
            }
        } else {
            // Normal movement - chase player
            super.update(delta, playerPos);

            // Attack logic
            if (now - this.lastAttackTime > this.attackCooldown) {
                this.executeAttack(playerPos);
                this.lastAttackTime = now;
            }
        }

        // Scanner highlight effect
        if (this.highlighted) {
            this.mesh.material.color.setHex(0xffffff);
        }
    }

    executeAttack(playerPos) {
        const attack = this.attackPatterns[Math.floor(Math.random() * this.attackPatterns.length)];

        switch(attack) {
            case 'charge':
                this.chargeAttack(playerPos);
                break;
            case 'aoe':
                this.aoeAttack();
                break;
            case 'summon':
                this.summonMinions();
                break;
        }
    }

    chargeAttack(playerPos) {
        this.isCharging = true;
        this.chargeTarget = playerPos.clone();
        alertMessage("BOSS CHARGE!");
    }

    aoeAttack() {
        // Create expanding ring of damage
        const playerPos = controls.getObject().position;
        const dist = this.mesh.position.distanceTo(playerPos);

        if (dist < 80) {
            // Player takes damage if within range
            const damage = 30 * perkMultipliers.damageTaken;
            if (hasShield) {
                shieldHealth -= damage;
                if (shieldHealth <= 0) {
                    hasShield = false;
                    shieldHealth = 0;
                }
            } else if (!(selectedAbility === 'phase' && isAbilityActive)) {
                health -= damage;
                showDamageVignette();
                shakeIntensity = 1.5;
            }
        }

        // Visual effect - expanding ring
        const ringGeo = new THREE.RingGeometry(1, 3, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(this.mesh.position);
        ring.position.y = 1;
        ring.rotation.x = -Math.PI / 2;
        scene.add(ring);

        // Animate ring expansion
        let scale = 1;
        const expandInterval = setInterval(() => {
            scale += 5;
            ring.scale.set(scale, scale, 1);
            ring.material.opacity -= 0.05;
            if (ring.material.opacity <= 0) {
                clearInterval(expandInterval);
                scene.remove(ring);
            }
        }, 50);

        alertMessage("AOE ATTACK!");
    }

    summonMinions() {
        // Spawn 3 chargers
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const spawnPos = new THREE.Vector3(
                this.mesh.position.x + Math.cos(angle) * 30,
                5,
                this.mesh.position.z + Math.sin(angle) * 30
            );
            const minion = new Charger(this.scene, spawnPos);
            enemies.push(minion);
        }
        alertMessage("MINIONS SUMMONED!");
    }

    die() {
        super.die();
        // Extra reward for boss kill
        score += 500;
        alertMessage("BOSS DEFEATED! +500 BONUS");
    }
}

// --- Item Classes ---
class Item {
    constructor(scene, position) {
        this.scene = scene;
        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        this.mesh.position.y = 5; // Floating height
        this.scene.add(this.mesh);
        this.alive = true;
        this.rotationSpeed = 2.0;
    }

    createMesh() {
        return new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    }

    update(delta) {
        this.mesh.rotation.y += this.rotationSpeed * delta;
        this.mesh.position.y = 5 + Math.sin(performance.now() * 0.005) * 2; // Float effect
    }

    pickup() {
        this.alive = false;
        this.scene.remove(this.mesh);
        playSound('pickup');
    }
}

class HealthPack extends Item {
    createMesh() {
        const geo = new THREE.BoxGeometry(6, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        // Can add a "Plus" inner mesh if complex, but simple box for now
        return new THREE.Mesh(geo, mat);
    }

    applyEffect() {
        health = Math.min(100, health + 30);
        updateHUD();
        alertMessage("HEALTH +30");
    }
}

class AmmoCrate extends Item {
    createMesh() {
        const geo = new THREE.BoxGeometry(6, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
        return new THREE.Mesh(geo, mat);
    }

    applyEffect() {
        weaponState.currentAmmo = weaponState.ammoCapacity; // Refill current
        WEAPONS[currentWeaponIndex].currentAmmo = weaponState.ammoCapacity;
        updateHUD();
        alertMessage("AMMO REFILLED");
    }
}

function alertMessage(msg) {
    // Show alert message on screen
    const alertDiv = document.getElementById('alert-message');
    if (alertDiv) {
        alertDiv.textContent = msg;
        alertDiv.style.opacity = '1';
        setTimeout(() => {
            alertDiv.style.opacity = '0';
        }, 1500);
    }
    console.log(msg);
}

// --- Advanced Movement Functions ---
function startSlide() {
    if (isSliding || slideCooldownTimer > 0) return;

    isSliding = true;
    slideTimer = SLIDE_DURATION;
    currentMovementState = MovementState.SLIDING;

    // Capture direction at start of slide
    slideDirection.set(
        Number(moveRight) - Number(moveLeft) + joystickVector.x,
        0,
        Number(moveForward) - Number(moveBackward) + joystickVector.y
    );
    if (slideDirection.length() === 0) {
        slideDirection.set(0, 0, 1); // Default forward
    }
    slideDirection.normalize();

    playSound('slide');
}

function endSlide() {
    isSliding = false;
    slideCooldownTimer = SLIDE_COOLDOWN;
    isCrouching = false;
    currentMovementState = MovementState.IDLE;
}

function startDash() {
    if (dashCharges <= 0 || isDashing) return;

    isDashing = true;
    dashTimer = DASH_DURATION;
    dashCharges--;
    currentMovementState = MovementState.DASHING;

    // Get dash direction from current movement or camera facing
    dashDirection.set(
        Number(moveRight) - Number(moveLeft) + joystickVector.x,
        0,
        Number(moveForward) - Number(moveBackward) + joystickVector.y
    );

    if (dashDirection.length() === 0) {
        // Dash forward if not moving
        controls.getDirection(dashDirection);
        dashDirection.y = 0;
    }
    dashDirection.normalize();

    playSound('dash');
    alertMessage("DASH!");
}

function endDash() {
    isDashing = false;
    currentMovementState = MovementState.IDLE;
}

// --- Ability Functions ---
function useAbility() {
    if (abilityCooldownTimer > 0) return;

    const ability = ABILITIES[selectedAbility];
    abilityCooldownTimer = ability.cooldown;

    switch(selectedAbility) {
        case 'blink':
            // Teleport 30 units forward
            const dir = new THREE.Vector3();
            controls.getDirection(dir);
            dir.y = 0;
            dir.normalize();
            controls.getObject().position.add(dir.multiplyScalar(30));
            playSound('blink');
            alertMessage("BLINK!");
            break;

        case 'overcharge':
            // Double fire rate for 5 seconds
            isAbilityActive = true;
            abilityDuration = 5;
            alertMessage("OVERCHARGE ACTIVE!");
            playSound('overcharge');
            break;

        case 'phase':
            // Invulnerable for 2 seconds
            isAbilityActive = true;
            abilityDuration = 2;
            alertMessage("PHASE SHIFT!");
            playSound('phase');
            break;

        case 'scanner':
            // Highlight all enemies for 5 seconds
            isAbilityActive = true;
            abilityDuration = 5;
            enemies.forEach(e => {
                if (e.mesh) {
                    e.highlighted = true;
                    e.originalColor = e.mesh.material.color.getHex();
                }
            });
            alertMessage("THREAT SCANNER!");
            playSound('scanner');
            break;
    }

    updateHUD();
}

function updateAbility(delta) {
    // Update ability cooldown
    if (abilityCooldownTimer > 0) {
        abilityCooldownTimer -= delta;
        if (abilityCooldownTimer < 0) abilityCooldownTimer = 0;
    }

    // Update active ability duration
    if (isAbilityActive && abilityDuration > 0) {
        abilityDuration -= delta;
        if (abilityDuration <= 0) {
            endAbilityEffect();
        }
    }
}

function endAbilityEffect() {
    isAbilityActive = false;
    abilityDuration = 0;

    // Reset scanner highlighting
    if (selectedAbility === 'scanner') {
        enemies.forEach(e => {
            if (e.highlighted && e.mesh && e.originalColor) {
                e.mesh.material.color.setHex(e.originalColor);
                e.highlighted = false;
            }
        });
    }
}

// --- Killstreak Functions ---
function addKill() {
    currentKillstreak++;
    if (currentKillstreak > highestKillstreak) {
        highestKillstreak = currentKillstreak;
    }

    // Check for killstreak rewards
    if (KILLSTREAKS[currentKillstreak]) {
        activateKillstreak(currentKillstreak);
    }

    // Vampirism perk
    if (selectedPerks.includes('vampirism')) {
        health = Math.min(100, health + 10);
    }

    updateHUD();
}

function resetKillstreak() {
    currentKillstreak = 0;
    updateHUD();
}

function activateKillstreak(streak) {
    const ks = KILLSTREAKS[streak];
    alertMessage(`${ks.name.toUpperCase()}!`);
    playSound('killstreak');

    switch(streak) {
        case 3: // Speed Boost
            speedBuffMultiplier = 1.5;
            activeBuffs.push({ type: 'speed', duration: ks.duration, name: ks.name });
            break;
        case 5: // Damage Amp
            damageBuffMultiplier = 1.5;
            activeBuffs.push({ type: 'damage', duration: ks.duration, name: ks.name });
            break;
        case 7: // Shield
            hasShield = true;
            shieldHealth = 50;
            activeBuffs.push({ type: 'shield', duration: ks.duration, name: ks.name });
            break;
        case 10: // Orbital Strike
            triggerOrbitalStrike();
            break;
        case 15: // Neon Storm
            activeBuffs.push({ type: 'storm', duration: ks.duration, name: ks.name });
            break;
    }

    updateHUD();
}

function triggerOrbitalStrike() {
    // Deal 200 damage to all enemies
    enemies.forEach(e => {
        e.takeDamage(200);
    });

    // Visual effect - screen flash
    const flash = document.getElementById('damage-vignette');
    if (flash) {
        flash.style.boxShadow = "inset 0 0 200px rgba(255, 255, 0, 0.8)";
        setTimeout(() => {
            flash.style.boxShadow = "inset 0 0 100px rgba(255, 255, 0, 0.0)";
        }, 500);
    }

    shakeIntensity = 2.0;
    playSound('orbital');
}

function updateBuffs(delta) {
    for (let i = activeBuffs.length - 1; i >= 0; i--) {
        const buff = activeBuffs[i];
        buff.duration -= delta;

        if (buff.duration <= 0) {
            // Remove buff effect
            switch(buff.type) {
                case 'speed':
                    speedBuffMultiplier = 1.0;
                    break;
                case 'damage':
                    damageBuffMultiplier = 1.0;
                    break;
                case 'shield':
                    hasShield = false;
                    shieldHealth = 0;
                    break;
            }
            activeBuffs.splice(i, 1);
        }
    }

    // Neon Storm damage
    const stormBuff = activeBuffs.find(b => b.type === 'storm');
    if (stormBuff) {
        enemies.forEach(e => {
            const dist = e.mesh.position.distanceTo(controls.getObject().position);
            if (dist < 200) {
                e.takeDamage(5 * delta); // 5 damage per second
            }
        });
    }
}

// --- In-Game Perk Panel ---
let perkPanelOpen = false;

function togglePerkPanel() {
    const panel = document.getElementById('perk-panel');
    perkPanelOpen = !perkPanelOpen;

    if (perkPanelOpen) {
        // Build perk cards
        const grid = document.getElementById('perk-panel-grid');
        grid.innerHTML = '';
        Object.entries(PERKS).forEach(([key, perk]) => {
            const card = document.createElement('div');
            card.className = 'perk-panel-card' + (selectedPerks.includes(key) ? ' active' : '');
            card.innerHTML = `<span class="perk-name">${perk.name}</span><span class="perk-desc">${perk.description}</span>`;
            card.addEventListener('click', () => {
                if (card.classList.contains('active')) {
                    card.classList.remove('active');
                    selectedPerks = selectedPerks.filter(p => p !== key);
                } else {
                    if (selectedPerks.length < 2) {
                        card.classList.add('active');
                        selectedPerks.push(key);
                    } else {
                        const oldKey = selectedPerks.shift();
                        grid.querySelector(`.perk-panel-card.active`)?.classList.remove('active');
                        card.classList.add('active');
                        selectedPerks.push(key);
                        // Re-sync active states
                        grid.querySelectorAll('.perk-panel-card').forEach(c => {
                            const cKey = Object.keys(PERKS)[Array.from(grid.children).indexOf(c)];
                            c.classList.toggle('active', selectedPerks.includes(cKey));
                        });
                    }
                }
                applyPerks();
            });
            grid.appendChild(card);
        });

        panel.style.display = 'flex';
        // Unlock pointer so user can click
        if (controls && controls.isLocked && !isMobileActive) {
            document.exitPointerLock();
        }
    } else {
        panel.style.display = 'none';
        // Re-lock pointer on close (desktop only)
        if (!isMobileActive && !isGameOver) {
            renderer.domElement.requestPointerLock();
        }
    }
}

// Expose to global for onclick
window.togglePerkPanel = togglePerkPanel;

// --- Perk Functions ---
function applyPerks() {
    // Reset multipliers
    perkMultipliers = {
        reloadTime: 1.0,
        damageTaken: 1.0,
        headshotBonus: 1.0,
        ammoPickup: 1.0,
        baseDamage: 1.0,
        crouchSpeed: 1.0
    };

    selectedPerks.forEach(perk => {
        switch(perk) {
            case 'quickReload':
                perkMultipliers.reloadTime = 0.7;
                break;
            case 'thickSkin':
                perkMultipliers.damageTaken = 0.85;
                break;
            case 'deadEye':
                perkMultipliers.headshotBonus = 1.25;
                break;
            case 'scavenger':
                perkMultipliers.ammoPickup = 1.5;
                break;
            case 'heavyHitter':
                perkMultipliers.baseDamage = 1.1;
                break;
            case 'ninja':
                perkMultipliers.crouchSpeed = 1.5;
                break;
        }
    });
}

// --- Game Mode Functions ---
function setGameMode(mode) {
    currentGameMode = mode;
    waveNumber = 0;
    enemiesRemainingInWave = 0;
    waveIntermission = false;
    intermissionTimer = 0;
    survivalTime = 0;
    timeAttackTimer = 120;
    bonusKillCounter = 0;

    updateHUD();
}

function startWave() {
    waveNumber++;
    waveIntermission = false;

    const enemyCount = 5 + waveNumber * 2;
    const isBossWave = waveNumber % 5 === 0;

    if (isBossWave) {
        // Boss wave
        spawnBoss();
        enemiesRemainingInWave = 1 + Math.floor(enemyCount / 3);
        // Spawn some regular enemies too
        for (let i = 0; i < Math.floor(enemyCount / 3); i++) {
            setTimeout(() => spawnEnemy(), i * 500);
        }
    } else {
        enemiesRemainingInWave = enemyCount;
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => spawnEnemy(), i * 300);
        }
    }

    alertMessage(`WAVE ${waveNumber}`);
    updateHUD();
}

function completeWave() {
    waveIntermission = true;
    intermissionTimer = 10; // 10 seconds between waves
    playSound('waveComplete');
    alertMessage(`WAVE ${waveNumber} COMPLETE!`);

    // Bonus health restore
    health = Math.min(100, health + 20);
    updateHUD();
}

function spawnBoss() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 100;
    const spawnPos = new THREE.Vector3(
        controls.getObject().position.x + Math.cos(angle) * radius,
        10,
        controls.getObject().position.z + Math.sin(angle) * radius
    );

    const boss = new BossEnemy(scene, spawnPos);
    enemies.push(boss);
}

function updateWaveMode(delta) {
    if (waveIntermission) {
        intermissionTimer -= delta;
        if (intermissionTimer <= 0) {
            startWave();
        }
    }
}

function updateTimeAttack(delta) {
    timeAttackTimer -= delta;

    if (timeAttackTimer <= 0) {
        // Time's up!
        if (score >= targetScore) {
            alertMessage("TARGET REACHED! YOU WIN!");
        } else {
            alertMessage("TIME'S UP!");
        }
        gameOver();
    }

    // Spawn enemies continuously
    if (Math.random() < delta * 2) { // Roughly 2 per second chance
        spawnEnemy();
    }
}

function updateSurvivalMode(delta) {
    survivalTime += delta;

    // Increase difficulty over time
    const difficultyScale = 1.0 + (survivalTime / 60) * 0.2;

    // Check milestones
    const milestones = [60, 120, 180, 300];
    milestones.forEach(milestone => {
        if (Math.floor(survivalTime) === milestone && Math.floor(survivalTime - delta) < milestone) {
            alertMessage(`${milestone} SECONDS SURVIVED!`);
            health = Math.min(100, health + 10);
        }
    });
}


// Audio
let audioCtx;

// --- Init ---
init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205); // Darker for bloom
    scene.fog = new THREE.Fog(0x020205, 0, 750);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10;

    // Weapon Model (Visual)
    const weaponGeo = new THREE.BoxGeometry(0.5, 0.5, 2);
    const weaponMat = new THREE.MeshBasicMaterial({ color: weaponState.color });
    weapon = new THREE.Mesh(weaponGeo, weaponMat);
    weapon.position.set(0.5, -0.5, -1);
    camera.add(weapon);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.5);
    hemiLight.position.set(0.5, 1, 0.75);
    scene.add(hemiLight);

    // Starfield Skybox
    createSkybox();

    const pointLight = new THREE.PointLight(0xff00ff, 2, 100);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);

    // Controls
    controls = new PointerLockControls(camera, document.body);

    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const btnStart = document.getElementById('btn-start');
    const btnRestart = document.getElementById('btn-restart');

    // Difficulty Buttons
    const diffBtns = document.querySelectorAll('.diff-btn');
    diffBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            diffBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentDifficulty = e.target.getAttribute('data-diff');
            console.log("Difficulty set to:", currentDifficulty);
        });
    });

    // Game Mode Selection
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
        card.addEventListener('click', (e) => {
            modeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const mode = card.getAttribute('data-mode');
            if (mode === 'survival') currentGameMode = GameMode.SURVIVAL;
            else if (mode === 'wave') currentGameMode = GameMode.WAVE;
            else if (mode === 'time_attack') currentGameMode = GameMode.TIME_ATTACK;
            console.log("Game mode set to:", currentGameMode);
        });
    });

    // Weapon Selection
    const primaryWeaponSelect = document.getElementById('primary-weapon');
    if (primaryWeaponSelect) {
        primaryWeaponSelect.addEventListener('change', (e) => {
            primaryWeaponIndex = parseInt(e.target.value);
            console.log("Primary weapon set to:", WEAPONS[primaryWeaponIndex].name);
        });
    }

    // Ability Selection
    const abilityCards = document.querySelectorAll('.ability-card');
    abilityCards.forEach(card => {
        card.addEventListener('click', (e) => {
            abilityCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedAbility = card.getAttribute('data-ability');
            console.log("Ability set to:", selectedAbility);
        });
    });

    // Perk Selection (max 2)
    const perkCards = document.querySelectorAll('.perk-card');
    perkCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const perk = card.getAttribute('data-perk');

            if (card.classList.contains('active')) {
                // Deselect
                card.classList.remove('active');
                selectedPerks = selectedPerks.filter(p => p !== perk);
            } else {
                // Select (max 2)
                if (selectedPerks.length < 2) {
                    card.classList.add('active');
                    selectedPerks.push(perk);
                } else {
                    // Replace oldest selection
                    const oldestPerk = selectedPerks.shift();
                    document.querySelector(`.perk-card[data-perk="${oldestPerk}"]`).classList.remove('active');
                    card.classList.add('active');
                    selectedPerks.push(perk);
                }
            }
            console.log("Selected perks:", selectedPerks);
        });
    });

    // Guide Toggle
    const guideToggle = document.querySelector('.guide-toggle');
    if (guideToggle) {
        guideToggle.addEventListener('click', () => {
            const guideCard = document.querySelector('.guide-card');
            guideCard.classList.toggle('collapsed');
            const span = guideToggle.querySelector('span');
            span.textContent = guideCard.classList.contains('collapsed') ? '+' : '-';
        });
    }

    btnStart.addEventListener('click', () => {
        console.log("Start button clicked");
        initAudio();

        // Apply selected settings
        applyPerks();
        switchWeapon(primaryWeaponIndex);

        // Start Spawning
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            // Is Mobile
            isMobileActive = true;
            controls.isLocked = true;
            startScreen.style.display = 'none';
            gameOverScreen.classList.add('hidden');
            setupMobileControls();

            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(e => console.log(e));
            }
        } else {
            controls.lock();
        }

        // Start based on game mode
        if (currentGameMode === GameMode.WAVE) {
            startWave();
        } else {
            startSpawning();
        }
    });

    btnRestart.addEventListener('click', () => {
        resetGame();
        controls.lock();
        startSpawning();
    });

    controls.addEventListener('lock', () => {
        startScreen.style.display = 'none';
        gameOverScreen.classList.add('hidden');
    });

    controls.addEventListener('unlock', () => {
        if (!isGameOver) {
            startScreen.style.display = 'flex';
        }
        stopSpawning();
    });

    scene.add(controls.getObject());

    // Input
    const onKeyDown = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': moveForward = true; break;
            case 'ArrowLeft':
            case 'KeyA': moveLeft = true; break;
            case 'ArrowDown':
            case 'KeyS': moveBackward = true; break;
            case 'ArrowRight':
            case 'KeyD': moveRight = true; break;
            case 'ShiftLeft':
            case 'ShiftRight':
                isSprinting = true;
                // Trigger slide if crouching while sprinting
                if (isCrouching && !isSliding && slideCooldownTimer <= 0 && (moveForward || moveBackward || moveLeft || moveRight)) {
                    startSlide();
                }
                break;
            case 'Space':
                if (canJump === true) {
                    velocity.y += 450;
                    playSound('jump');
                    currentMovementState = MovementState.JUMPING;
                }
                canJump = false;
                break;
            case 'KeyC':
            case 'ControlLeft':
                // Trigger slide if sprinting
                if (isSprinting && !isSliding && slideCooldownTimer <= 0 && (moveForward || moveBackward || moveLeft || moveRight)) {
                    startSlide();
                } else {
                    isCrouching = true;
                }
                break;
            case 'KeyQ': // Dash
                if (dashCharges > 0 && !isDashing) {
                    startDash();
                }
                break;
            case 'KeyE': // Ability
                if (abilityCooldownTimer <= 0) {
                    useAbility();
                }
                break;
            case 'BracketLeft':
                baseSpeed = Math.max(50, baseSpeed - 50);
                console.log("Speed decreased to:", baseSpeed);
                break;
            case 'BracketRight':
                baseSpeed += 50;
                console.log("Speed increased to:", baseSpeed);
                break;
            // Weapon switching - Primary weapons (1-7)
            case 'Digit1': switchWeapon(0); break;
            case 'Digit2': switchWeapon(1); break;
            case 'Digit3': switchWeapon(2); break;
            case 'Digit4': switchWeapon(3); break;
            case 'Digit5': switchWeapon(4); break;
            case 'Digit6': switchWeapon(5); break;
            case 'Digit7': switchWeapon(6); break;
            case 'Digit8': switchWeapon(7); break; // Secondary (Volt Pistol)
            case 'KeyR': reload(); break;
        }
    };

    const onKeyUp = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': moveForward = false; break;
            case 'ArrowLeft':
            case 'KeyA': moveLeft = false; break;
            case 'ArrowDown':
            case 'KeyS': moveBackward = false; break;
            case 'ArrowRight':
            case 'KeyD': moveRight = false; break;
            case 'ShiftLeft':
            case 'ShiftRight': isSprinting = false; break;
            case 'KeyC':
            case 'ControlLeft':
                isCrouching = false;
                break;
        }
    };

    // Mouse input
    const onMouseDown = function(event) {
        if (event.button === 0) { // Left click - shoot
            shoot();
        } else if (event.button === 2) { // Right click - ADS
            isADS = true;
        }
    };

    const onMouseUp = function(event) {
        if (event.button === 2) { // Right click release - exit ADS
            isADS = false;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable right-click menu

    // World - Neon Grid
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(-Math.PI / 2);

    const floorMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    scene.add(floor);

    // Level Design
    generateMap();

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: false }); // Post-proc handles AA usually, or better perf without
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    document.body.appendChild(renderer.domElement);

    // Post-Processing (Bloom)
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0;
    bloomPass.strength = 1.5; // High bloom
    bloomPass.radius = 0;

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    window.addEventListener('resize', onWindowResize);

    // Initial Enemies
    // spawnEnemy(); deleted, handled in startSpawning
}

function setupMobileControls() {
    const joyZone = document.getElementById('joystick-zone');
    const joyKnob = document.getElementById('joystick-knob');
    const btnFire = document.getElementById('btn-fire');
    const btnJump = document.getElementById('btn-jump');
    const btnReload = document.getElementById('btn-reload');
    const btnSwitch = document.getElementById('btn-switch');

    // Joystick Logic
    let joyId = null;
    let joyStartX = 0;
    let joyStartY = 0;

    joyZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        joyId = touch.identifier;
        joyStartX = touch.clientX;
        joyStartY = touch.clientY;

        joyKnob.style.transition = 'none';
    }, { passive: false });

    joyZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joyId) {
                const touch = e.changedTouches[i];
                const dx = touch.clientX - joyStartX;
                const dy = touch.clientY - joyStartY;

                // Clamp
                const maxDist = 35;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const clampDist = Math.min(dist, maxDist);
                const angle = Math.atan2(dy, dx);

                const clampX = Math.cos(angle) * clampDist;
                const clampY = Math.sin(angle) * clampDist;

                joyKnob.style.transform = `translate(-50%, -50%) translate(${clampX}px, ${clampY}px)`;

                // Update Vector (-1 to 1)
                joystickVector.x = clampX / maxDist;
                joystickVector.y = clampY / maxDist; // Forward is -Z in 3D, but joystick up is -Y in screen. 
                // In game loop: direction.z = Number(moveForward) - Number(moveBackward). Forward is +1 in logic? 
                // Wait. direction.z: 1=Forward? 
                // Line 379 KeyW -> moveForward=true.
                // Line 880: velocity.z -= direction.z * speed
                // controls.moveForward(-velocity.z)
                // If moveForward=true, direction.z=1. vel.z decreases (becomes negative).
                // moveForward(-neg) -> moves positive forward.
                // So direction.z should be +1 for forward.
                // Joystick Up (Negative Screen Y) should be +1 direction.z.

                joystickVector.y = -(clampY / maxDist);
            }
        }
    }, { passive: false });

    const resetJoy = () => {
        joyId = null;
        joystickVector.x = 0;
        joystickVector.y = 0;
        joyKnob.style.transform = `translate(-50%, -50%)`;
        joyKnob.style.transition = 'transform 0.1s';
    };

    joyZone.addEventListener('touchend', resetJoy);
    joyZone.addEventListener('touchcancel', resetJoy);

    // Camera Look (Right half of screen mainly, or anywhere not joystick)
    document.addEventListener('touchstart', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.target.closest('#mobile-controls button')) continue;
            if (t.target.closest('#joystick-zone')) continue;

            // Assume look touch
            if (touchLookId === null && t.clientX > window.innerWidth / 3) {
                touchLookId = t.identifier;
                touchLookLastX = t.clientX;
                touchLookLastY = t.clientY;
            }
        }
    });

    document.addEventListener('touchmove', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === touchLookId) {
                const dx = t.clientX - touchLookLastX;
                const dy = t.clientY - touchLookLastY;

                touchLookLastX = t.clientX;
                touchLookLastY = t.clientY;

                // Apply Rotation
                // Yaw (Y axis) - World
                controls.getObject().rotation.y -= dx * 0.005;

                // Pitch (X axis) - Camera local
                // Assuming PointerLock structure: Object -> Camera
                // Actually PointerLockControls typically adds camera to this.pitchObject to this.yawObject.
                // Note: controls.getObject() is likely the yawObject.
                // But let's check standard implementation. usually camera.rotation.x is used if simplified?
                // Line 301: camera created.
                // Line 324: controls created.
                // If I modify camera.rotation.x directly?
                camera.rotation.x -= dy * 0.005;
                camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
            }
        }
    }, { passive: false });

    const resetLook = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchLookId) {
                touchLookId = null;
            }
        }
    };
    document.addEventListener('touchend', resetLook);
    document.addEventListener('touchcancel', resetLook);

    // Buttons
    btnFire.addEventListener('touchstart', (e) => {
        e.preventDefault();
        shoot(); // Single shot
        // For auto-fire, would need loop. Let's start with single.
    });

    btnJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (canJump) {
            velocity.y += 450;
            playSound('jump');
            canJump = false;
        }
    });

    btnReload.addEventListener('touchstart', (e) => { e.preventDefault(); reload(); });

    btnSwitch.addEventListener('touchstart', (e) => {
        e.preventDefault();
        switchWeapon((currentWeaponIndex + 1) % WEAPONS.length);
    });

    // New mobile control buttons
    const btnSlide = document.getElementById('btn-slide');
    const btnDash = document.getElementById('btn-dash');
    const btnAbility = document.getElementById('btn-ability');

    // Slide button
    if (btnSlide) {
        btnSlide.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (movementState === 'walking' || movementState === 'sprinting') {
                startSlide();
            }
        });
        btnSlide.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (movementState === 'sliding') {
                endSlide();
            }
        });
    }

    // Dash button
    if (btnDash) {
        btnDash.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDash();
        });
    }

    // Ability button
    if (btnAbility) {
        btnAbility.addEventListener('touchstart', (e) => {
            e.preventDefault();
            useAbility();
        });
    }
}

function startSpawning() {
    stopSpawning();
    const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    spawnEnemy();
    enemySpawnInterval = setInterval(() => {
        if (controls.isLocked && !isGameOver) spawnEnemy();
    }, settings.spawnRate);
}

function stopSpawning() {
    if (enemySpawnInterval) clearInterval(enemySpawnInterval);
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    switch(type) {
        case 'shoot':
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        case 'explosion':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        case 'jump':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(500, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        case 'pickup':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.linearRampToValueAtTime(1000, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        case 'slide':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
        case 'dash':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        case 'blink':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
            break;
        case 'overcharge':
        case 'phase':
        case 'scanner':
            osc.type = 'square';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.linearRampToValueAtTime(1500, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
        case 'killstreak':
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
            osc.frequency.linearRampToValueAtTime(1600, now + 0.2);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        case 'orbital':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(50, now);
            osc.frequency.linearRampToValueAtTime(200, now + 0.5);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
            break;
        case 'headshot':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.linearRampToValueAtTime(1800, now + 0.05);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        case 'waveComplete':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.1);
            osc.frequency.linearRampToValueAtTime(600, now + 0.2);
            osc.frequency.linearRampToValueAtTime(1000, now + 0.3);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
            break;
        case 'bossSpawn':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.linearRampToValueAtTime(40, now + 0.5);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
            break;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function switchWeapon(index) {
    if (index === currentWeaponIndex || index >= WEAPONS.length) return;

    currentWeaponIndex = index;
    const stats = WEAPONS[index];

    // Transfer logic: reset ammo state to fresh for now (or track per weapon if complex)
    // For simplicity: each weapon track its own ammo eventually, but let's persist state in WEAPONS array?
    // Let's attach state to WEAPONS array directly to persist ammo between switches

    if (!WEAPONS[index].currentAmmo && WEAPONS[index].currentAmmo !== 0) {
        WEAPONS[index].currentAmmo = stats.ammoCapacity;
    }

    weaponState = {
        ...stats,
        currentAmmo: WEAPONS[index].currentAmmo !== undefined ? WEAPONS[index].currentAmmo : stats.ammoCapacity,
        isReloading: false,
        lastShotTime: 0
    };

    // Update visual
    if (weapon) {
        weapon.material.color.setHex(stats.color);
    }

    updateHUD();
}

function reload() {
    if (weaponState.isReloading || weaponState.currentAmmo === weaponState.ammoCapacity) return;

    weaponState.isReloading = true;
    updateHUD(); // Show "Reloading..."

    setTimeout(() => {
        weaponState.currentAmmo = weaponState.ammoCapacity;
        WEAPONS[currentWeaponIndex].currentAmmo = weaponState.currentAmmo; // Save back to storage
        weaponState.isReloading = false;
        updateHUD();
    }, weaponState.reloadTime);
}

function shoot() {
    if (!controls.isLocked || isGameOver || weaponState.isReloading) return;

    const now = performance.now();

    // Overcharge ability doubles fire rate
    let effectiveFireRate = weaponState.fireRate;
    if (selectedAbility === 'overcharge' && isAbilityActive) {
        effectiveFireRate = weaponState.fireRate / 2;
    }

    if (now - weaponState.lastShotTime < effectiveFireRate) return;

    if (weaponState.currentAmmo <= 0) {
        playSound('dryfire');
        reload();
        return;
    }

    weaponState.lastShotTime = now;
    weaponState.currentAmmo--;
    WEAPONS[currentWeaponIndex].currentAmmo = weaponState.currentAmmo;

    updateHUD();
    playSound('shoot');
    createMuzzleFlash();

    shakeIntensity = isADS ? 0.2 : 0.5;
    recoilAmount = isADS ? 0.1 : 0.2;

    const pelletCount = weaponState.pelletCount || 1;

    for (let i = 0; i < pelletCount; i++) {
        const bulletGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: weaponState.color || 0xffff00 });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

        const vector = new THREE.Vector3();
        weapon.getWorldPosition(vector);
        bullet.position.copy(vector);

        const direction = new THREE.Vector3();
        controls.getDirection(direction);

        // Use ADS spread if aiming, otherwise normal spread
        const spread = isADS ? (weaponState.adsSpread || weaponState.spread * 0.3) : weaponState.spread;
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.z += (Math.random() - 0.5) * spread;
        direction.normalize();

        // Calculate base damage with multipliers
        let baseDamage = weaponState.damage * perkMultipliers.baseDamage * damageBuffMultiplier;

        bullet.velocity = direction.multiplyScalar(300);
        bullet.alive = true;
        bullet.life = 100;
        bullet.damage = baseDamage;
        bullet.headshotMult = weaponState.headshotMult || 1.5;
        bullet.range = weaponState.range || 500;
        bullet.startPos = bullet.position.clone();

        scene.add(bullet);
        bullets.push(bullet);
    }
}

function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 50 + Math.random() * 100;
    const spawnPos = new THREE.Vector3(
        controls.getObject().position.x + Math.cos(angle) * radius,
        5, // y pos
        controls.getObject().position.z + Math.sin(angle) * radius
    );

    let enemy;
    const r = Math.random();
    if (r < 0.5) {
        enemy = new Charger(scene, spawnPos);
    } else if (r < 0.8) {
        enemy = new Shooter(scene, spawnPos);
    } else {
        enemy = new Tank(scene, spawnPos);
    }

    // Apply Difficulty Modifiers
    const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    enemy.health *= settings.enemyHealthMult;
    enemy.damage *= settings.damageMult;

    enemies.push(enemy);
}

function createExplosion(position, color) {
    playSound('explosion');
    const particleCount = 20;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: color });

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50
        );
        particle.life = 1.0;
        scene.add(particle);
        particles.push(particle);
    }
}

function createMuzzleFlash() {
    const flashColor = 0xffffaa;
    const flashGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({ color: flashColor });
    const flash = new THREE.Mesh(flashGeo, flashMat);

    const vector = new THREE.Vector3();
    weapon.getWorldPosition(vector);
    // Push slightly forward
    const dir = new THREE.Vector3();
    controls.getDirection(dir);
    flash.position.copy(vector).add(dir.multiplyScalar(2));

    scene.add(flash);

    // Light
    const light = new THREE.PointLight(flashColor, 10, 20);
    light.position.copy(flash.position);
    scene.add(light);

    // Remove quickly
    setTimeout(() => {
        scene.remove(flash);
        scene.remove(light);
    }, 50);
}

function createSkybox() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const posArray = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 2000;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
}

function showHitMarker() {
    const marker = document.getElementById('hit-marker');
    marker.style.opacity = 1;
    setTimeout(() => {
        marker.style.opacity = 0;
    }, 100);
}

function generateMap() {
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.3 });
    const pillarMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });

    // 1. Boundary Walls
    createWall(0, 50, -1000, 2000, 100, 10, wallMat); // North
    createWall(0, 50, 1000, 2000, 100, 10, wallMat);  // South
    createWall(-1000, 50, 0, 10, 100, 2000, wallMat); // West
    createWall(1000, 50, 0, 10, 100, 2000, wallMat);  // East

    // 2. Pillars (4 Corners of center)
    createPillar(200, 200, 40, 100, pillarMat);
    createPillar(-200, 200, 40, 100, pillarMat);
    createPillar(200, -200, 40, 100, pillarMat);
    createPillar(-200, -200, 40, 100, pillarMat);

    // 3. High Walls for Cover
    createWall(0, 25, 400, 200, 50, 10, wallMat);
    createWall(0, 25, -400, 200, 50, 10, wallMat);
    createWall(400, 25, 0, 10, 50, 200, wallMat);
    createWall(-400, 25, 0, 10, 50, 200, wallMat);

    // 4. Random cover boxes
    for (let i = 0; i < 20; i++) {
        const s = 20 + Math.random() * 20;
        const x = (Math.random() - 0.5) * 1600;
        const z = (Math.random() - 0.5) * 1600;
        // Avoid center spawn area
        if (Math.abs(x) < 50 && Math.abs(z) < 50) continue;

        createWall(x, s / 2, z, s, s, s, wallMat);
    }
}

function createWall(x, y, z, w, h, d, mat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
}

function createPillar(x, z, radius, height, mat) {
    const geo = new THREE.CylinderGeometry(radius, radius, height, 16);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height / 2, z);
    scene.add(mesh);
}

function spawnItem(position) {
    const r = Math.random();
    let item;
    if (r < 0.2) { // 20% Chance for Item Drop
        if (Math.random() < 0.5) {
            item = new HealthPack(scene, position);
        } else {
            item = new AmmoCrate(scene, position);
        }
        items.push(item);
    }
}

function showDamageVignette() {
    const v = document.getElementById('damage-vignette');
    v.style.boxShadow = "inset 0 0 100px rgba(255, 0, 0, 0.8)";
    setTimeout(() => {
        v.style.boxShadow = "inset 0 0 100px rgba(255, 0, 0, 0.0)";
    }, 200);
}

function updateHUD() {
    // Ammo and weapon
    const ammoText = weaponState.isReloading ? "RELOADING..." : `${weaponState.currentAmmo} / ${weaponState.ammoCapacity}`;
    const ammoEl = document.getElementById('ammo-count');
    const weaponEl = document.getElementById('weapon-name');
    if (ammoEl) ammoEl.innerText = ammoText;
    if (weaponEl) weaponEl.innerText = weaponState.name;

    // Score
    const scoreEl = document.getElementById('score-count');
    if (scoreEl) scoreEl.innerText = score;

    // Health
    const healthFill = document.getElementById('health-fill');
    if (healthFill) healthFill.style.width = Math.max(0, health) + '%';

    // Shield (if exists)
    const shieldEl = document.getElementById('shield-bar');
    if (shieldEl) {
        if (hasShield && shieldHealth > 0) {
            shieldEl.style.display = 'block';
            shieldEl.style.width = (shieldHealth / 50 * 100) + '%';
        } else {
            shieldEl.style.display = 'none';
        }
    }

    // Killstreak
    const killstreakEl = document.getElementById('killstreak-count');
    if (killstreakEl) killstreakEl.innerText = currentKillstreak;

    const killstreakFill = document.getElementById('killstreak-fill');
    if (killstreakFill) {
        const nextStreak = [3, 5, 7, 10, 15].find(s => s > currentKillstreak) || 15;
        const prevStreak = [0, 3, 5, 7, 10].reverse().find(s => s < currentKillstreak) || 0;
        const progress = ((currentKillstreak - prevStreak) / (nextStreak - prevStreak)) * 100;
        killstreakFill.style.width = Math.min(100, progress) + '%';
    }

    // Dash charges
    const dashEl = document.getElementById('dash-charges');
    if (dashEl) {
        dashEl.innerHTML = '';
        for (let i = 0; i < 2; i++) {
            const pip = document.createElement('div');
            pip.className = 'dash-pip' + (i < dashCharges ? '' : ' empty');
            dashEl.appendChild(pip);
        }
    }

    // Ability cooldown
    const abilityEl = document.getElementById('ability-cooldown');
    const abilityNameEl = document.getElementById('ability-name');
    if (abilityEl) {
        const ability = ABILITIES[selectedAbility];
        const cooldownPercent = (abilityCooldownTimer / ability.cooldown) * 100;
        abilityEl.style.height = cooldownPercent + '%';
    }
    if (abilityNameEl) {
        abilityNameEl.innerText = ABILITIES[selectedAbility].name;
    }

    // Game mode specific HUD
    const waveEl = document.getElementById('wave-number');
    const timeEl = document.getElementById('time-remaining');
    const survivalEl = document.getElementById('survival-time');

    if (waveEl) waveEl.style.display = currentGameMode === GameMode.WAVE ? 'block' : 'none';
    if (timeEl) timeEl.style.display = currentGameMode === GameMode.TIME_ATTACK ? 'block' : 'none';
    if (survivalEl) survivalEl.style.display = currentGameMode === GameMode.SURVIVAL ? 'block' : 'none';

    if (currentGameMode === GameMode.WAVE && waveEl) {
        const waveSpan = waveEl.querySelector('span');
        if (waveSpan) waveSpan.innerText = waveNumber;
        if (waveIntermission) {
            waveEl.innerText = `NEXT WAVE IN ${Math.ceil(intermissionTimer)}...`;
        }
    }

    if (currentGameMode === GameMode.TIME_ATTACK && timeEl) {
        const mins = Math.floor(timeAttackTimer / 60);
        const secs = Math.floor(timeAttackTimer % 60);
        const timeSpan = timeEl.querySelector('span');
        if (timeSpan) timeSpan.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    if (currentGameMode === GameMode.SURVIVAL && survivalEl) {
        const mins = Math.floor(survivalTime / 60);
        const secs = Math.floor(survivalTime % 60);
        const survivalSpan = survivalEl.querySelector('span');
        if (survivalSpan) survivalSpan.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Active buffs
    const buffsEl = document.getElementById('buff-bar');
    if (buffsEl) {
        buffsEl.innerHTML = '';
        activeBuffs.forEach(buff => {
            const buffDiv = document.createElement('div');
            buffDiv.className = 'buff-indicator';
            buffDiv.innerText = `${buff.name} ${Math.ceil(buff.duration)}s`;
            buffsEl.appendChild(buffDiv);
        });
    }
}

function resetGame() {
    score = 0;
    health = 100;

    // Reset Weapons
    WEAPONS.forEach(w => w.currentAmmo = w.ammoCapacity);
    switchWeapon(0);

    isGameOver = false;

    // Reset advanced systems
    currentKillstreak = 0;
    activeBuffs = [];
    speedBuffMultiplier = 1.0;
    damageBuffMultiplier = 1.0;
    hasShield = false;
    shieldHealth = 0;

    // Reset movement
    isSliding = false;
    isDashing = false;
    dashCharges = 2;
    dashCooldownTimer = 0;
    slideCooldownTimer = 0;

    // Reset ability
    abilityCooldownTimer = 0;
    isAbilityActive = false;
    abilityDuration = 0;

    // Reset game mode
    waveNumber = 0;
    enemiesRemainingInWave = 0;
    waveIntermission = false;
    survivalTime = 0;
    timeAttackTimer = 120;
    bonusKillCounter = 0;

    // Apply perks
    applyPerks();

    // Clear entities
    enemies.forEach(e => scene.remove(e.mesh));
    bullets.forEach(b => scene.remove(b));
    enemyBullets.forEach(b => scene.remove(b));
    particles.forEach(p => scene.remove(p));

    enemies = [];
    bullets = [];
    enemyBullets = [];
    particles = [];

    items.forEach(i => scene.remove(i.mesh));
    items = [];

    controls.getObject().position.set(0, 10, 0);
    velocity.set(0, 0, 0);

    document.getElementById('game-over-screen').classList.add('hidden');
    updateHUD();
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();

    if (controls.isLocked === true || isMobileActive) {
        const delta = (time - prevTime) / 1000;

        // --- Update Systems ---
        updateAbility(delta);
        updateBuffs(delta);

        // Game Mode Updates
        if (currentGameMode === GameMode.WAVE) {
            updateWaveMode(delta);
        } else if (currentGameMode === GameMode.TIME_ATTACK) {
            updateTimeAttack(delta);
        } else if (currentGameMode === GameMode.SURVIVAL) {
            updateSurvivalMode(delta);
        }

        // --- ADS FOV Transition ---
        let targetFOV = defaultFOV;
        if (isADS) {
            targetFOV = weaponState.scopeZoom ? (defaultFOV / weaponState.scopeZoom) : (defaultFOV * 0.7);
        }
        currentFOV += (targetFOV - currentFOV) * adsTransitionSpeed * delta;
        camera.fov = currentFOV;
        camera.updateProjectionMatrix();

        // Weapon position during ADS
        if (isADS) {
            weapon.position.x += (0 - weapon.position.x) * 10 * delta;
            weapon.position.y += (-0.3 - weapon.position.y) * 10 * delta;
        } else {
            weapon.position.x += (0.5 - weapon.position.x) * 10 * delta;
            weapon.position.y += (-0.5 - weapon.position.y) * 10 * delta;
        }

        // --- Slide Cooldown ---
        if (slideCooldownTimer > 0) {
            slideCooldownTimer -= delta;
        }

        // --- Dash Charge Recharge ---
        if (dashCharges < 2) {
            dashCooldownTimer += delta;
            if (dashCooldownTimer >= DASH_COOLDOWN) {
                dashCharges++;
                dashCooldownTimer = 0;
            }
        }

        // --- Movement ---
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        // Gravity
        velocity.y -= 9.8 * 200.0 * delta;

        // --- Sliding Movement ---
        if (isSliding) {
            slideTimer -= delta;

            // Slide in captured direction
            const slideVel = slideDirection.clone().multiplyScalar(SLIDE_SPEED * delta);
            controls.moveRight(-slideVel.x);
            controls.moveForward(-slideVel.z);

            // Lower camera during slide
            currentHeight = crouchingHeight * 0.8;

            if (slideTimer <= 0) {
                endSlide();
            }
        }
        // --- Dashing Movement ---
        else if (isDashing) {
            dashTimer -= delta;

            // Dash in captured direction
            const dashVel = dashDirection.clone().multiplyScalar(DASH_SPEED * delta);
            controls.moveRight(-dashVel.x);
            controls.moveForward(-dashVel.z);

            if (dashTimer <= 0) {
                endDash();
            }
        }
        // --- Normal Movement ---
        else {
            direction.z = Number(moveForward) - Number(moveBackward) + joystickVector.y;
            direction.x = Number(moveRight) - Number(moveLeft) + joystickVector.x;
            direction.normalize();

            // Calculate speed multipliers
            let speedMultiplier = 1.0;
            if (isSprinting) speedMultiplier = 2.0;
            if (isCrouching) speedMultiplier = 0.5 * perkMultipliers.crouchSpeed;
            if (isADS) speedMultiplier *= 0.6; // Slower while aiming

            // Apply weapon movement penalty (LMG)
            if (weaponState.movementPenalty) {
                speedMultiplier *= weaponState.movementPenalty;
            }

            // Apply buff multipliers
            speedMultiplier *= speedBuffMultiplier;

            const currentSpeed = baseSpeed * speedMultiplier;

            if (moveForward || moveBackward || joystickVector.y !== 0) {
                velocity.z -= direction.z * currentSpeed * delta;
            }
            if (moveLeft || moveRight || joystickVector.x !== 0) {
                velocity.x -= direction.x * currentSpeed * delta;
            }

            controls.moveRight(-velocity.x * delta);
            controls.moveForward(-velocity.z * delta);
        }

        controls.getObject().position.y += (velocity.y * delta);

        // --- Crouch Height Handling ---
        let targetHeight = standingHeight;
        if (isCrouching && !isSliding) targetHeight = crouchingHeight;
        if (isSliding) targetHeight = crouchingHeight * 0.8;

        currentHeight += (targetHeight - currentHeight) * 10 * delta;

        if (controls.getObject().position.y < currentHeight) {
            velocity.y = 0;
            controls.getObject().position.y = currentHeight;
            canJump = true;
        }

        // --- Juice Effects ---
        if (shakeIntensity > 0) {
            const rx = (Math.random() - 0.5) * shakeIntensity;
            camera.rotation.z = rx * 0.1;
            shakeIntensity -= delta * 2;
            if (shakeIntensity < 0) {
                shakeIntensity = 0;
                camera.rotation.z = 0;
            }
        }

        if (recoilAmount > 0) {
            weapon.position.z = -1 + recoilAmount;
            recoilAmount -= delta * 1;
            if (recoilAmount < 0) {
                recoilAmount = 0;
                weapon.position.z = -1;
            }
        }

        // --- Bullets Update with Headshot Detection ---
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.position.add(b.velocity.clone().multiplyScalar(delta));
            b.life--;

            // Check range falloff
            let rangeFalloff = 1.0;
            if (b.startPos && b.range) {
                const distTraveled = b.position.distanceTo(b.startPos);
                if (distTraveled > b.range) {
                    rangeFalloff = Math.max(0.3, 1 - (distTraveled - b.range) / b.range);
                }
            }

            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                const hitDist = e instanceof Tank ? 15 : (e instanceof BossEnemy ? 20 : 8);

                if (b.position.distanceTo(e.mesh.position) < hitDist) {
                    // Calculate damage with headshot check
                    let damage = (b.damage || weaponState.damage) * rangeFalloff;

                    // Headshot detection - check if bullet hit upper 30% of enemy
                    const enemyTop = e.mesh.position.y + (e instanceof Tank ? 10 : (e instanceof BossEnemy ? 20 : 5));
                    const headThreshold = e.mesh.position.y + (e instanceof Tank ? 7 : (e instanceof BossEnemy ? 15 : 3.5));

                    if (b.position.y > headThreshold) {
                        // Headshot!
                        const headshotMult = (b.headshotMult || 1.5) * perkMultipliers.headshotBonus;
                        damage *= headshotMult;
                        playSound('headshot');
                        alertMessage("HEADSHOT!");
                    }

                    e.takeDamage(damage);

                    if (!e.alive) {
                        enemies.splice(j, 1);
                    }

                    scene.remove(b);
                    bullets.splice(i, 1);
                    break;
                }
            }

            if (b.life <= 0) {
                scene.remove(b);
                bullets.splice(i, 1);
            }
        }

        // --- Enemy Bullets with Shield/Phase Protection ---
        const playerPos = controls.getObject().position;
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const eb = enemyBullets[i];
            eb.position.add(eb.velocity.clone().multiplyScalar(delta));
            eb.life -= delta;

            if (eb.position.distanceTo(playerPos) < 5) {
                // Phase shift - invulnerable
                if (selectedAbility === 'phase' && isAbilityActive) {
                    scene.remove(eb);
                    enemyBullets.splice(i, 1);
                    continue;
                }

                let incomingDamage = 10 * perkMultipliers.damageTaken;

                // Shield absorbs damage first
                if (hasShield && shieldHealth > 0) {
                    shieldHealth -= incomingDamage;
                    if (shieldHealth <= 0) {
                        hasShield = false;
                        shieldHealth = 0;
                        alertMessage("SHIELD BROKEN!");
                    }
                } else {
                    health -= incomingDamage;
                    resetKillstreak(); // Getting hit resets killstreak
                }

                shakeIntensity += 1.0;
                showDamageVignette();
                updateHUD();
                scene.remove(eb);
                enemyBullets.splice(i, 1);

                if (health <= 0) {
                    gameOver();
                }
                continue;
            }

            if (eb.life <= 0) {
                scene.remove(eb);
                enemyBullets.splice(i, 1);
            }
        }

        // --- Particles Update ---
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            p.life -= delta;
            p.scale.multiplyScalar(0.95);

            if (p.life <= 0) {
                scene.remove(p);
                particles.splice(i, 1);
            }
        }

        // --- Enemies Update ---
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            e.update(delta, playerPos);

            // Scanner highlight effect
            if (selectedAbility === 'scanner' && isAbilityActive && e.mesh) {
                e.mesh.material.emissive = new THREE.Color(0xffffff);
                e.mesh.material.emissiveIntensity = 0.3;
            }

            // Player collision damage
            const hitDist = e instanceof Tank ? 15 : (e instanceof BossEnemy ? 20 : 8);
            if (e.mesh.position.distanceTo(playerPos) < hitDist) {
                // Phase shift - invulnerable
                if (selectedAbility === 'phase' && isAbilityActive) {
                    continue;
                }

                let touchDamage = (e.damage || 1) * 0.1 * perkMultipliers.damageTaken;

                if (hasShield && shieldHealth > 0) {
                    shieldHealth -= touchDamage;
                    if (shieldHealth <= 0) {
                        hasShield = false;
                        shieldHealth = 0;
                    }
                } else {
                    health -= touchDamage;
                    resetKillstreak();
                }

                shakeIntensity += 0.2;
                showDamageVignette();
                updateHUD();

                if (health <= 0) {
                    gameOver();
                }
            }
        }

        // --- Items Update ---
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            item.update(delta);

            if (item.mesh.position.distanceTo(playerPos) < 10) {
                item.applyEffect();
                item.pickup();
                items.splice(i, 1);
            }
        }

        // Update HUD periodically
        updateHUD();
    }

    prevTime = time;

    // Render with bloom
    composer.render();
}

function gameOver() {
    isGameOver = true;
    controls.unlock();
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
}
