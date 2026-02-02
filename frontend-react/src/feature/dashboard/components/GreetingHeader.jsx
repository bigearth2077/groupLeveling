import React from 'react';

export const GreetingHeader = ({ totalDuration = 0 }) => {
  const getGreeting = () => {
    if (totalDuration === 0) return "准备好开始今天的探索了吗？";
    if (totalDuration < 60) return "很好的开始，保持节奏！";
    if (totalDuration < 180) return "干得漂亮，今天非常高效。";
    return "不可思议的专注力，你是时间的主人！";
  };

  return (
    <div className="flex flex-col space-y-2">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        早安, 探索者
      </h1>
      <p className="text-muted-foreground animate-in slide-in-from-left-2 duration-500">
        {getGreeting()}
      </p>
    </div>
  );
};
