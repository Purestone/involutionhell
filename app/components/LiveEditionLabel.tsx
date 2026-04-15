/**
 * Header 左侧刊期展示：实时秒级时间戳 + 前端 steps 动画模拟的两位“毫秒”滚动。
 */
"use client";

import { useEffect, useState } from "react";

type LiveEditionLabelProps = {
  // milliseconds since epoch
  initialTimestamp: number;
};

export function LiveEditionLabel({ initialTimestamp }: LiveEditionLabelProps) {
  const [timestamp, setTimestamp] = useState(
    Math.floor(initialTimestamp / 1000),
  );
  const [currentDate, setCurrentDate] = useState(
    () => new Date(initialTimestamp),
  );
  /*
   * digits 数组包含 11 个元素：0..9，最后再补一个 0 以实现平滑循环。
   * 由于 '0' 出现了两次，如果不使用索引作为 key，会出现 key 重复的报错。
   * 因此必须使用索引 `i` 作为唯一 key。
   */
  const digits = Array.from({ length: 11 }, (_, i) => i % 10); // extra 0 for smooth loop

  useEffect(() => {
    const intervalId = setInterval(() => {
      const nowMs = Date.now();
      setTimestamp(Math.floor(nowMs / 1000));
      setCurrentDate(new Date(nowMs));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // 初次渲染（水合阶段）使用固定时区（悉尼），保证服务端/客户端一致，
  // 避免时区差异导致 React error #418（hydration mismatch）。
  // 挂载后也继续使用悉尼时区保持一致性。
  const TIMEZONE = "Australia/Sydney";
  const editionDay = Number(
    currentDate.toLocaleString("en-US", { day: "numeric", timeZone: TIMEZONE }),
  );
  const editionMonth = currentDate.toLocaleString("en-US", {
    month: "long",
    timeZone: TIMEZONE,
  });

  return (
    <>
      {/* 下方 CSS steps 动画模拟毫秒级的两位小数跳动效果 */}
      <style jsx>{`
        @keyframes digitTickerFast {
          0% {
            transform: translate3d(0, 0px, 0);
          }
          100% {
            transform: translate3d(0, -100px, 0);
          } /* 10px * 10 */
        }
        @keyframes digitTickerFaster {
          0% {
            transform: translate3d(0, 0px, 0);
          }
          100% {
            transform: translate3d(0, -100px, 0);
          }
        }
        .digit-slot {
          position: relative;
          display: inline-block;
          height: 10px; /* 与 text-[10px] 对齐 */
          width: 8px; /* 0.75em≈7.5px，改整数更稳 */
          overflow: hidden;
          line-height: 10px;
          text-align: center;
          vertical-align: baseline;
        }
        .digit-char {
          height: 10px;
          line-height: 10px;
        }

        .digit-seq {
          display: flex;
          flex-direction: column;
          line-height: 10px;
          will-change: transform;
          transform: translate3d(0, 0, 0);
        }
        .digit-seq.fast {
          animation: digitTickerFast 0.5s steps(10, end) infinite;
        }
        .digit-seq.faster {
          animation: digitTickerFaster 0.2s steps(10, end) infinite;
        }
        .ms-digits {
          display: inline-flex;
          align-items: baseline; /* 关键：跟前面的数字同一基线 */
          gap: 0; /* 融入感更强，必要时用 0.5px */
          font: inherit; /* 继承 font-family/size/weight */
          line-height: inherit; /* 继承行高 */
          letter-spacing: inherit; /* 继承 tracking-widest */
          color: inherit; /* 继承颜色 */
          vertical-align: baseline;
        }
      `}</style>
      <div className="hidden md:block font-mono text-[10px] uppercase tracking-widest text-neutral-500">
        Vol. {editionDay} | No.{" "}
        <span className="inline-flex items-center align-middle">
          <span>{timestamp}</span>
          <span className="inline-flex items-center gap-[1px] align-middle ms-digits">
            <span className="digit-slot">
              <span className="digit-seq fast">
                {digits.map((d, i) => (
                  <span className="digit-char" key={`fast-${i}`}>
                    {d}
                  </span>
                ))}
              </span>
            </span>
            <span className="digit-slot">
              <span className="digit-seq faster">
                {digits.map((d, i) => (
                  <span className="digit-char" key={`faster-${i}`}>
                    {d}
                  </span>
                ))}
              </span>
            </span>
          </span>
        </span>{" "}
        | {editionMonth} Edition
      </div>
    </>
  );
}
