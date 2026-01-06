import { useMemo } from "react";

const welcomeMessages = [
  "欢迎回来",
  "继续你的学习之旅",
  "准备好专注学习了吗？",
  "让我们一起提升效率",
  "开始你的番茄钟之旅",
  "专注，从现在开始",
];

function WelcomeTitle() {
  const randomMessage = useMemo(() => {
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  }, []);

  return (
    <h1 className="text-5xl font-bold mb-8 text-primary">
      {randomMessage}
    </h1>
  );
}

export default WelcomeTitle;

