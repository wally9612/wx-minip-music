// components/progress-bar/progress-bar.js
let movableAreaWidth = 0; // 歌曲播放进度条宽度
let movableViewWidth = 0; // 歌曲圆点宽度
let duration = 0;  // 储存歌曲总时长
let currentSec = -1; // 当前播放的秒数
let isMoving = false; // 用户是否拖拽进度条圆点

const backgroundAudioManager = wx.getBackgroundAudioManager();
const app = getApp();

Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    showTime: {
      currentTime: '00:00',
      totalTime: '00:00'
    },
    movableDis: 0,
    percent: 0
  },

  lifetimes: {
    // 在组件布局完成后执行
    ready() {
      this._getMovableDis();
      this._bindBGMEvent();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 进度条圆点移动事件
     */
    onChange(event) {
      // 拖动进度条的时候，event事件属性下的source属性会等于'touch'
      if (event.detail.source == 'touch') {
        // 注意：不是通过setData修改的值不会同步到页面(只是在this.data上新增属性)
        this.data.progress = event.detail.x / (movableAreaWidth - movableViewWidth) * 100;
        this.data.movableDis = event.detail.x;
        isMoving = true;
      }
    },
    /**
     * 用户停止拖拽（松开进度条圆点）
     */
    onTouchEnd() {
      //设置音乐进度
      backgroundAudioManager.seek(this.data.progress * duration / 100);
      let currentTimeFmt = this._formatTime(backgroundAudioManager.currentTime);

      this.setData({
        progress: this.data.progress,
        movableDis: this.data.movableDis,
        'showTime.currentTime': `${ currentTimeFmt.min }:${ currentTimeFmt.sec }` 
      });
      isMoving = false;
    },
    /**
     * 获取当前设备中的进度条及其进度条圆点的尺寸
     */
    _getMovableDis() {
      const query = this.createSelectorQuery();
      query.select('.movable-area').boundingClientRect();
      query.select('.movable-view').boundingClientRect();
      query.exec(rect => {
        movableAreaWidth = rect[0].width;
        movableViewWidth = rect[1].width;
      });
    },
    /**
     * 监听背景音频播放事件
     */
    _bindBGMEvent() {
      // 播放事件
      backgroundAudioManager.onPlay(() => {
        isMoving = false;
        console.log('onPlay');
      });
      // 监听背景音频停止事件
      backgroundAudioManager.onStop(() => {
        console.log('onStop');
      });
      // 监听背景音频暂停事件
      backgroundAudioManager.onPause(() => {
        console.log('onPause');
      });
      // 监听背景音频加载中事件
      backgroundAudioManager.onWaiting(() => {
        console.log('onWaiting')
      });
      // 监听背景音频进入可播放状态事件
      backgroundAudioManager.onCanplay(() => {
        if (typeof backgroundAudioManager.duration !== 'undefined') {
          this._durationTime();
        } else {
          setTimeout(() => {
            this._durationTime();
          }, 1000);
        }
      });
      // 监听背景音频播放进度更新事件
      backgroundAudioManager.onTimeUpdate(() => {
        if (isMoving) return;

        const currentTime = backgroundAudioManager.currentTime;
        const sec = currentTime.toString().split('.')[0];
        // 性能优化 (因为onTimeUpdate事件每秒约执行4次，频繁的setData影响性能)
        if (sec != currentSec) {
          const currentTimeFmt = this._formatTime(currentTime); // 格式化时间

          this.setData({
            // 进度条圆点的位置更新
            movableDis: (movableAreaWidth - movableViewWidth) * currentTime / duration,
            // 进度条白色背景宽度更新
            progress: currentTime / duration * 100,
            // 设置当前播放的时间
            'showTime.currentTime': `${ currentTimeFmt.min }:${ currentTimeFmt.sec }`
          });
          currentSec = sec;
        }
      });
      // 监听背景音频自然播放结束事件
      backgroundAudioManager.onEnded(() => {
      });
      // 监听背景音频播放错误事件
      backgroundAudioManager.onError(() => {
      });
    },
    /**
     * 获取音乐总时长，并调用时间格式化函数，把格式化后的字符串赋值给界面数据
     */
    _durationTime() {
      duration = backgroundAudioManager.duration;
      this.setData({
        'showTime.totalTime': `${ this._formatTime(duration).min }:${ this._formatTime(duration).sec }`
      });
    },
    /**
     * 格式化时间
     */
    _formatTime(times) {
      // 向下取整，获取分钟
      let min = Math.floor(times / 60);
      // 向下取余数,获取秒数
      let sec = Math.floor(times % 60);
      return {
        min: this._parseZero(min),
        sec: this._parseZero(sec)
      }
    },
    /**
     * 歌词时间（分）补零
     */
    _parseZero(time) {
      return time < 10 ? `0${ time }` : time;
    }
  }
})