export const performanceFrames = [
  require('../../assets/animations/pip-chair-performance/frames/pip-chair_00.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair_01.png'),
  require('../../assets/animations/pip-chair-performance/frames/pip-chair_02.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair_03.png'),
  require('../../assets/animations/pip-chair-performance/frames/pip-chair_04.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair_05.png'),
  require('../../assets/animations/pip-chair-performance/frames/pip-chair_06.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair_07.png'),
  require('../../assets/animations/pip-chair-performance/frames/pip-chair_08.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair_09.png'),
  require('../../assets/animations/pip-chair-performance/frames/pip-chair_10.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair-contact-v2.png'),
  require('../../assets/animations/pip-chair-performance/frames/pip-chair-settle-v2.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair-rest-v2.png'),
];
const customPerformanceFrames = {
  berry: [
    require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-00.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-01.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-02.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-03.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-04.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-05.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-06.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-07.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-08.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-09.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-10.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-11.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-12.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-13.png'),
  ],
  lilac: [
    require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-00.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-01.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-02.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-03.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-04.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-05.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-06.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-07.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-08.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-09.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-10.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-11.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-12.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/sage-nordic/frame-13.png'),
  ],
};

export function chairArt(frame: number, neck?: string) {
  if (neck === 'scarf-berry') return customPerformanceFrames.berry[frame];
  if (neck === 'scarf-lavender') return customPerformanceFrames.lilac[frame];
  return performanceFrames[frame];
}
