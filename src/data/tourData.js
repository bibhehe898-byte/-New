const SCENE_ID = 'workshop'

export const PANORAMA_URL = `${import.meta.env.BASE_URL}panoramas/workshop-placeholder.png`

/**
 * Точки интереса. Координаты подобраны под тестовую панораму
 * public/panoramas/workshop-placeholder.png.
 */
export const TOUR_HOTSPOTS = [
  {
    id: 'pilot',
    nodeId: 'assembly_pilot',
    step: 'Участок 1',
    label: 'Участок сборки пилота',
    description: 'Сборка узла пилота',
    yaw: -146,
    pitch: -2,
    hfov: 72,
  },
  {
    id: 'membrane',
    nodeId: 'assembly_membrane',
    step: 'Участок 2',
    label: 'Участок мембран',
    description: 'Загрузка 95%, узкое место',
    yaw: -95,
    pitch: -2,
    hfov: 72,
  },
  {
    id: 'qc',
    nodeId: 'qc_check',
    step: 'Участок 3',
    label: 'Участок ОТК',
    description: 'Контроль качества ОТК',
    yaw: 35,
    pitch: -2,
    hfov: 72,
  },
  {
    id: 'benchmark',
    nodeId: null,
    step: 'Эталон',
    label: 'Эталонное рабочее место',
    description: 'Эталон организации рабочего места по системе 5S',
    yaw: 117,
    pitch: -2,
    hfov: 72,
  },
]

export const TOUR_CONFIG = {
  default: {
    firstScene: SCENE_ID,
    sceneFadeDuration: 800,
    autoLoad: true,
    showFullscreenCtrl: false,
  },
  scenes: {
    [SCENE_ID]: {
      type: 'equirectangular',
      panorama: PANORAMA_URL,
      yaw: 0,
      pitch: 0,
      hfov: 95,
      minHfov: 50,
      maxHfov: 110,
      hotSpots: TOUR_HOTSPOTS.map(({ yaw, pitch, label }) => ({
        yaw,
        pitch,
        type: 'info',
        text: label,
        cssClass: 'tour-hotspot',
      })),
    },
  },
}
