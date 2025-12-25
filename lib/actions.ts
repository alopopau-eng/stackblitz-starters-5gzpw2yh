

export const playNotificationSound = () => {
    const audio=new Audio('/notification-1-269296.mp3')
    if (audio) {
      audio!.play().catch((error) => {
        console.error('Failed to play sound:', error);
      });
    }
  };
