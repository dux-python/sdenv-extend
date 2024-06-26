// 循环体执行监控
import _orderBy from 'lodash-es/orderBy';

export function loopRunInit() {
  const sdenv = this;
  const addUtil = sdenv.getTools('addUtil');
  const preLoop = {};
  const win = sdenv.memory.sdWindow;
  const runloop = sdenv.cache.runloop = { current: 1 };

  let log = false;

  addUtil((key, idx, name, runlist = '', lens = 0) => {
    /*
      * 初始化一个循环
      *   key: 循环体的case的变量名
      *   idx: 初始化下标
      *   name: 循环方法名称
      *   runlist: 循环任务名或者循环任务队列
      *   lens: 任务队列长度
      * */
    const arr = []
    const current = runloop.current++;
    if (!runloop[key]) {
      runloop[key] = [];
    }
    const loopobj = {
      idx, // 启动的下标
      name, // 函数名
      data: arr, // 实际运行队列
      current, // 启动编号
      idxs: [], // 实际运行下标队列
      list: Array.isArray(runlist) ? runlist.join() : runlist, // 预期运行队列
      lens: lens || (Array.isArray(runlist) ? runlist.length : -1), // 预期运行队列长度
      pre: { // 上一次循环信息
        current: preLoop.cur,
        curloop: preLoop.num,
      },
      param: {}, // 需要记录的关键数据
    }
    if (preLoop.loop) {
      preLoop.loop.param[preLoop.loop.data.length - 1] = {
        next: current // 档次编号记录到父循环中
      }
    }
    runloop[key].push(loopobj);
    if (log) win.console.log(`【RUN TASK】current：${current}`);
    return {
      addLoop: (id, it, _key) => {
        loopobj.data.push(it);
        loopobj.idxs.push(id);
        Object.assign(preLoop, {
          key: _key,
          cur: current,
          num: arr.length,
          loop: loopobj,
        });
        return (...args) => {
          if (log) {
            console.log([`(${current}，${arr.length})`, ...args.map(it => sdenv.tools.compressText(it, 200))].join(' ==== '));
          }
        }
      },
      curLoop: () => arr.length,
      current,
      loopobj,
      openLog: () => (log = true),
      closeLog: () => (log = false),
      isLog: () => log,
    }
  }, 'initLoop');

  // 上一个循环的信息
  addUtil(() => ({ ...preLoop }), 'getPreLoop');

  addUtil(() => log, 'getLogLoop');

  addUtil(() => log = false, 'closeLogLoop');

  addUtil(() => log = true, 'openLogLoop');

  addUtil((copy) => {
    // 返回循环体运行数据，copy为复制方法，非浏览器环境需要手动传入
    const data = JSON.parse(JSON.stringify(runloop));
    const ascii = {};
    Object.entries(data).forEach(([key, item]) => {
      if (!Array.isArray(item)) return;
      ascii[key] = {}
      item.forEach((each) => {
        each.data.forEach((it) => {
          if (ascii[key][it] === undefined) ascii[key][it] = 0;
          ascii[key][it]++;
        })
        each.data = each.data.join();
        each.idxs = each.idxs.join();
      })
      ascii[key] = _orderBy(Object.entries(ascii[key]).map(([code, num]) => ({ code, num })), 'num', 'desc')
    });
    if (copy) {
      copy(JSON.stringify(data));
      console.log('运行时数据复制成功');
    }
    return { ascii, ...data };
  }, 'getLoopData');
}
