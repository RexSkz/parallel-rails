/**
 * All used constants
 * @author Rex Zeng
 */

export default class DataConstants {
    constructor() {
        return {
            // default style
            DEFAULT_FONT: 'Consolas',
            DEFAULT_FONT_SIZE: 16,
            DEFAULT_COLOR: '#fff',
            JUDGEMENT_LINE_LEFT: 250,
            // music list
            MUSIC_LIST_ITEM_WIDTH: 390,
            MUSIC_LIST_ITEM_HEIGHT: 75,
            MUSIC_LIST_ITEM_PADDING: 15,
            MUSIC_LIST_ITEM_TITLE_SIZE: 20,
            MUSIC_LIST_ITEM_TITLE_MARGIN_BOTTOM: 10,
            MUSIC_LIST_ITEM_CREATOR_SIZE: 16,
            MUSIC_LIST_ITEM_X_DELTA: 0.05,
            MUSIC_LIST_ITEM_Y_DELTA: 0.02,
            MUSIC_LIST_SWITCH_TIME: 90,
            // timing window
            TIMING_WINDOW_WIDTH_PERCENT: 0.9,
            TIMING_WINDOW_HEIGHT: 30,
            TIMING_NUMBER_FONT_SIZE: 12,
            // help window
            HELP_WINDOW_PADDING: 10,
            // scenes
            SCENE_SWITCH_TIME: 20,
            // time ruler window
            TIME_RULER_WINDOW_HEIGHT: 100,
            TIME_RULER_LINE_TOP: 80,
            TIME_RULER_LINE_HEIGHT: 20,
            TIME_RULER_COLORS: {
                1: [0xFFFFFF],
                2: [0xFFFFFF, 0xE30405],
                3: [0xFFFFFF, 0xB204B6, 0xB204B6],
                4: [0xFFFFFF, 0x2E74E6, 0xE30405, 0x2E74E6],
                6: [0xFFFFFF, 0x2E74E6, 0x2E74E6, 0xE30405, 0x2E74E6, 0x2E74E6],
                8: [0xFFFFFF, 0xE3E405, 0x2E74E6, 0xE3E405, 0xE30405, 0xE3E405, 0x2E74E6, 0xE3E405],
                12: [0xFFFFFF, 0x8E9092, 0x803C84, 0x2E74E6, 0xB203B6, 0x8E9092, 0xE30405, 0x8E9092, 0xB203B6, 0x2E74E6, 0x803C84, 0x8E9092]
            },
            // hit object window
            HITOBJ_WINDOW_PADDING: 20,
            HITOBJ_CIRCLE_RADIUS: 27,
            HITOBJ_MARGIN_SIZE: 2.75,
            RAIL_MARGIN: 100,
            // hit score sprite
            SCORE_SPRITE_HEIGHT: 20,
            SCORE_SPRITE_FONT_SIZE: 24,
            SCORE_SPRITE_EXPIRE_FRAMES: 20,
            SCORE_SPRITE_DISAPPEAR_RATE: 2
        };
    }
}
