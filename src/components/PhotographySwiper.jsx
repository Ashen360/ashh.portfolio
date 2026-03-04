import { useState, useEffect } from 'react';
import { useSprings, animated, to as interpolate } from '@react-spring/web';
import { useDrag } from 'react-use-gesture';
import './PhotographySwiper.css';

import lookingahead from '../assets/Images/lookingahead.jpg';
import busPic from '../assets/Images/bus-pic.jpg';
import busPicStairs from '../assets/Images/bus-pic-stairs.jpg';
import cityHorizon from '../assets/Images/cityhorizon.jpg';
import doggo from '../assets/Images/doggo.jpg';
import burgerJoint from '../assets/Images/burgerjoint.jpg';
import expensiveMelody from '../assets/Images/expensivemelody.jpg';
import urbanScene from '../assets/Images/urbanscene.jpg';
import sunsetCar from '../assets/Images/sunset-car.jpg';
import squidFood from '../assets/Images/squidfood.jpg';
import museumMe from '../assets/Images/museum-me.jpg';
import orangeCat from '../assets/Images/orangecat.jpg';
import flower from '../assets/Images/flower.jpg';
import pinkBlueSky from '../assets/Images/pinkbluesky.jpg';

const photos = [
  lookingahead,
  busPic,
  busPicStairs,
  cityHorizon,
  doggo,
  burgerJoint,
  expensiveMelody,
  urbanScene,
  sunsetCar,
  squidFood,
  museumMe,
  orangeCat,
  flower,
  pinkBlueSky,
];

const to = (i) => ({
  x: 0,
  y: i * -4,
  scale: 1,
  rot: -10 + Math.random() * 20,
  delay: i * 100,
});

const from = () => ({ x: 0, rot: 0, scale: 1.5, y: -1000 });

const trans = (r, s) =>
  `rotateZ(${r}deg) scale(${s})`;

export default function PhotographySwiper() {
  const [gone] = useState(() => new Set());
  const [props, api] = useSprings(photos.length, (i) => ({
    ...to(i),
    from: from(),
  }));

  const bind = useDrag(
    ({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
      const trigger = velocity > 0.2;
      const dir = xDir < 0 ? -1 : 1;

      if (!down && trigger) {
        gone.add(index);
      }

      api.start((i) => {
        if (index !== i) return;
        const isGone = gone.has(index);
        const x = isGone ? (200 + window.innerWidth) * dir : down ? mx : 0;
        const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0);
        const scale = down ? 1.1 : 1;

        return {
          x,
          rot,
          scale,
          delay: undefined,
          config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
        };
      });

      if (!down && gone.size === photos.length) {
        setTimeout(() => {
          gone.clear();
          api.start((i) => to(i));
        }, 600);
      }
    }
  );

  return (
    <div className="photography-swiper">
      {props.map(({ x, y, rot, scale }, i) => (
        <animated.div
          className="photo-card-deck"
          key={i}
          style={{ x, y }}
        >
          <animated.div
            className="photo-card"
            {...bind(i)}
            style={{
              transform: interpolate([rot, scale], trans),
              backgroundImage: `url(${photos[i]})`,
            }}
          />
        </animated.div>
      ))}
    </div>
  );
}
