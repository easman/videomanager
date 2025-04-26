import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen: React.FC = () => {
  const [show, setShow] = useState(true);
  const [text, setText] = useState('美丽王二宝');

  useEffect(() => {
    // 2秒后切换文字
    const textTimer = setTimeout(() => {
      setText('幸福每一天');
    }, 2000);

    // 4秒后隐藏整个组件
    const hideTimer = setTimeout(() => {
      setShow(false);
    }, 4000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #fff0f6 0%, #ffadd2 100%)',
            zIndex: 9999,
          }}
        >
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              fontSize: '15vw',
              fontWeight: 300,
              color: '#eb2f96',
              textShadow: '0 4px 8px rgba(235, 47, 150, 0.2)',
              fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
              letterSpacing: '0.1em',
              position: 'relative',
              textAlign: 'center',
              width: '100%',
              padding: '0 20px'
            }}
          >
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                bottom: -10,
                left: 0,
                height: 2,
                background: 'linear-gradient(90deg, transparent, #eb2f96, transparent)',
                boxShadow: '0 2px 4px rgba(235, 47, 150, 0.3)',
              }}
            />
            {text}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen; 