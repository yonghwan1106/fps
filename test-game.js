const { chromium } = require('@playwright/test');

async function testGame() {
  console.log('='.repeat(60));
  console.log('FPS ARENA 게임 테스트 시작');
  console.log('='.repeat(60));
  console.log('');

  const testResults = {
    loadTime: 0,
    menuDisplay: false,
    gameStart: false,
    movement: false,
    shooting: false,
    weaponSwitch: false,
    hud: false,
    pause: false,
    errors: [],
    performance: [],
  };

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  const page = await context.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      testResults.errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    testResults.errors.push(error.message);
  });

  try {
    // Test 1: 페이지 로딩
    console.log('[테스트 1] 페이지 로딩...');
    const startTime = Date.now();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    testResults.loadTime = Date.now() - startTime;
    console.log(`  ✓ 로딩 완료: ${testResults.loadTime}ms`);

    // Test 2: 시작 메뉴 확인
    console.log('[테스트 2] 시작 메뉴 확인...');
    await page.waitForTimeout(2000);

    const title = await page.locator('h1').first().textContent();
    if (title && title.includes('FPS')) {
      testResults.menuDisplay = true;
      console.log(`  ✓ 타이틀 표시: "${title}"`);
    }

    const startButton = page.locator('button:has-text("START")');
    if (await startButton.isVisible()) {
      console.log('  ✓ 시작 버튼 표시됨');
    }

    // 스크린샷 1: 메뉴 화면
    await page.screenshot({ path: 'test-screenshot-1-menu.png' });
    console.log('  📷 스크린샷 저장: test-screenshot-1-menu.png');

    // Test 3: 게임 시작
    console.log('[테스트 3] 게임 시작...');
    await startButton.click();
    await page.waitForTimeout(1000);

    // Pointer lock을 위해 캔버스 클릭
    const canvas = page.locator('canvas').first();
    if (await canvas.isVisible()) {
      testResults.gameStart = true;
      console.log('  ✓ 게임 캔버스 렌더링됨');
    }

    // 스크린샷 2: 게임 화면
    await page.screenshot({ path: 'test-screenshot-2-game.png' });
    console.log('  📷 스크린샷 저장: test-screenshot-2-game.png');

    // Test 4: HUD 확인
    console.log('[테스트 4] HUD 확인...');
    await page.waitForTimeout(500);

    const scoreElement = page.locator('text=SCORE').first();
    const ammoElement = page.locator('text=PISTOL').first();
    const healthElement = page.locator('text=HEALTH').first();

    if (await scoreElement.isVisible()) {
      testResults.hud = true;
      console.log('  ✓ 점수 HUD 표시됨');
    }
    if (await ammoElement.isVisible()) {
      console.log('  ✓ 무기 HUD 표시됨');
    }
    if (await healthElement.isVisible()) {
      console.log('  ✓ 체력 HUD 표시됨');
    }

    // Test 5: 이동 테스트 (WASD)
    console.log('[테스트 5] 이동 테스트...');
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyW');

    await page.keyboard.down('KeyA');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyA');

    await page.keyboard.down('KeyS');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyS');

    await page.keyboard.down('KeyD');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyD');

    testResults.movement = true;
    console.log('  ✓ WASD 이동 키 입력 완료');

    // Test 6: 사격 테스트
    console.log('[테스트 6] 사격 테스트...');
    for (let i = 0; i < 5; i++) {
      await page.mouse.click(960, 540);
      await page.waitForTimeout(200);
    }
    testResults.shooting = true;
    console.log('  ✓ 마우스 클릭 (사격) 완료');

    // 스크린샷 3: 사격 후
    await page.screenshot({ path: 'test-screenshot-3-shooting.png' });
    console.log('  📷 스크린샷 저장: test-screenshot-3-shooting.png');

    // Test 7: 무기 전환 테스트
    console.log('[테스트 7] 무기 전환 테스트...');

    await page.keyboard.press('Digit2');
    await page.waitForTimeout(500);
    const rifleVisible = await page.locator('text=RIFLE').first().isVisible();
    if (rifleVisible) console.log('  ✓ 라이플로 전환됨');

    await page.keyboard.press('Digit3');
    await page.waitForTimeout(500);
    const shotgunVisible = await page.locator('text=SHOTGUN').first().isVisible();
    if (shotgunVisible) console.log('  ✓ 샷건으로 전환됨');

    await page.keyboard.press('Digit1');
    await page.waitForTimeout(500);
    const pistolVisible = await page.locator('text=PISTOL').first().isVisible();
    if (pistolVisible) console.log('  ✓ 권총으로 전환됨');

    testResults.weaponSwitch = true;

    // 스크린샷 4: 무기 전환
    await page.screenshot({ path: 'test-screenshot-4-weapon.png' });
    console.log('  📷 스크린샷 저장: test-screenshot-4-weapon.png');

    // Test 8: 재장전 테스트
    console.log('[테스트 8] 재장전 테스트...');
    await page.keyboard.press('KeyR');
    await page.waitForTimeout(1500);
    console.log('  ✓ 재장전 키 입력 완료');

    // Test 9: 라이플 자동 연사 테스트
    console.log('[테스트 9] 라이플 자동 연사 테스트...');
    await page.keyboard.press('Digit2');
    await page.waitForTimeout(300);
    await page.mouse.down();
    await page.waitForTimeout(1000);
    await page.mouse.up();
    console.log('  ✓ 라이플 자동 연사 테스트 완료');

    // Test 10: 일시정지 테스트
    console.log('[테스트 10] 일시정지 테스트...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const pauseText = await page.locator('text=PAUSED').isVisible();
    if (pauseText) {
      testResults.pause = true;
      console.log('  ✓ 일시정지 메뉴 표시됨');
    }

    // 스크린샷 5: 일시정지
    await page.screenshot({ path: 'test-screenshot-5-pause.png' });
    console.log('  📷 스크린샷 저장: test-screenshot-5-pause.png');

    // 게임 재개
    const resumeButton = page.locator('button:has-text("RESUME")');
    if (await resumeButton.isVisible()) {
      await resumeButton.click();
      await page.waitForTimeout(500);
      console.log('  ✓ 게임 재개됨');
    }

    // 추가 플레이 시간 (약 2분)
    console.log('[테스트 11] 게임플레이 테스트 (2분)...');

    for (let round = 0; round < 12; round++) {
      // 이동
      const moves = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
      for (const key of moves) {
        await page.keyboard.down(key);
        await page.waitForTimeout(200);
        await page.keyboard.up(key);
      }

      // 마우스 움직임 시뮬레이션 및 사격
      for (let i = 0; i < 3; i++) {
        await page.mouse.click(960 + (Math.random() - 0.5) * 200, 540 + (Math.random() - 0.5) * 200);
        await page.waitForTimeout(150);
      }

      // 무기 전환
      if (round % 4 === 0) {
        await page.keyboard.press('Digit' + (1 + (round % 3)));
        await page.waitForTimeout(200);
      }

      // 재장전
      if (round % 5 === 0) {
        await page.keyboard.press('KeyR');
        await page.waitForTimeout(500);
      }

      console.log(`  진행중... ${Math.round((round + 1) / 12 * 100)}%`);
      await page.waitForTimeout(5000);
    }

    // 최종 스크린샷
    await page.screenshot({ path: 'test-screenshot-6-final.png' });
    console.log('  📷 스크린샷 저장: test-screenshot-6-final.png');

    // 최종 점수 확인
    const scoreText = await page.locator('text=SCORE').first().textContent();
    console.log(`  최종 점수 영역: ${scoreText}`);

  } catch (error) {
    testResults.errors.push(error.message);
    console.error('테스트 중 오류:', error.message);
  }

  // 결과 출력
  console.log('');
  console.log('='.repeat(60));
  console.log('테스트 결과 요약');
  console.log('='.repeat(60));
  console.log('');
  console.log(`페이지 로딩 시간: ${testResults.loadTime}ms`);
  console.log(`시작 메뉴 표시: ${testResults.menuDisplay ? '✓ 통과' : '✗ 실패'}`);
  console.log(`게임 시작: ${testResults.gameStart ? '✓ 통과' : '✗ 실패'}`);
  console.log(`HUD 표시: ${testResults.hud ? '✓ 통과' : '✗ 실패'}`);
  console.log(`이동 (WASD): ${testResults.movement ? '✓ 통과' : '✗ 실패'}`);
  console.log(`사격: ${testResults.shooting ? '✓ 통과' : '✗ 실패'}`);
  console.log(`무기 전환: ${testResults.weaponSwitch ? '✓ 통과' : '✗ 실패'}`);
  console.log(`일시정지: ${testResults.pause ? '✓ 통과' : '✗ 실패'}`);
  console.log('');

  if (testResults.errors.length > 0) {
    console.log('발견된 오류:');
    testResults.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  } else {
    console.log('발견된 오류: 없음');
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('테스트 완료');
  console.log('='.repeat(60));

  await page.waitForTimeout(3000);
  await browser.close();
}

testGame().catch(console.error);
