import { useState, useEffect, useRef } from 'react';
import { useSprings, animated, to as interpolate } from '@react-spring/web';
import { useDrag } from 'react-use-gesture';
import './PhotographySwiper.css';

const photoData = [
  'lookingahead.jpg',
  'bus-pic.jpg',
  'bus-pic-stairs.jpg',
  'cityhorizon.jpg',
  'doggo.jpg',
  'burgerjoint.jpg',
  'expensivemelody.jpg',
  'urbanscene.jpg',
  'sunset-car.jpg',
  'squidfood.jpg',
  'museum-me.jpg',
  'orangecat.jpg',
  'flower.jpg',
  'pinkbluesky.jpg',
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
  const [photos, setPhotos] = useState([]);
  const [gone] = useState(() => new Set());
  const [props, api] = useSprings(photoData.length, (i) => ({
    ...to(i),
    from: from(),
  }));
  const preloadedImagesRef = useRef({});

  useEffect(() => {
    // Preload images dynamically
    const loadImages = async () => {
      const loadedPhotos = [];
      
      for (const photo of photoData) {
        const path = new URL(`../assets/Images/${photo}`, import.meta.url).href;
        loadedPhotos.push(path);
        preloadedImagesRef.current[photo] = path;
      }
      
      setPhotos(loadedPhotos);
    };

    loadImages();
  }, []);

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

      if (!down && gone.size === photoData.length) {
        setTimeout(() => {
          gone.clear();
          api.start((i) => to(i));
        }, 600);
      }
    }
  );

  // Return early if images not loaded yet
  if (photos.length === 0) {
    return <div className="photography-swiper"></div>;
  }

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
