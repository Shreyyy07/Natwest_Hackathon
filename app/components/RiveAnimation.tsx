// components/RiveAnimation.tsx
import { useRive } from '@rive-app/react-canvas';

const RiveAnimation = () => {
  const { RiveComponent } = useRive({
    src: '/your-animation.riv', // Add your .riv file to public folder
    autoplay: true,
    stateMachines: 'State Machine 1', // Adjust to your state machine name
  });

  return <RiveComponent className="w-full h-full" />;
};

export default RiveAnimation;
