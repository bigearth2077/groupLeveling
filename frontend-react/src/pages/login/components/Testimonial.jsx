import { useMemo } from "react";

function Testimonial() {
  const testimonials = [
    {
      quote: "这个番茄钟应用彻底改变了我的学习方式，专注力提升了300%！",
      author: "张同学",
      role: "大学生",
    },
    {
      quote: "每天25分钟的专注时间，让我在3个月内完成了之前一年都做不到的学习目标。",
      author: "李老师",
      role: "在职学习者",
    },
    {
      quote: "简单易用，界面美观，最重要的是真的有效！强烈推荐给所有需要专注学习的人。",
      author: "王同学",
      role: "考研党",
    },
    {
      quote: "番茄工作法配合这个应用，让我从拖延症患者变成了高效学习者。",
      author: "刘同学",
      role: "程序员",
    },
    {
      quote: "界面设计很棒，每次打开都让我有学习的动力。25分钟一个番茄，效率真的很高！",
      author: "陈同学",
      role: "设计师",
    },
  ];

  // 随机选择3条评价
  const selectedTestimonials = useMemo(() => {
    const shuffled = [...testimonials].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 1);
  }, []);

  return (
    <div className="relative z-20 max-h-[400px] overflow-y-auto">
      <div className="space-y-6">
        {selectedTestimonials.map((testimonial, index) => (
          <blockquote key={index} className="space-y-2">
            <p className="text-lg text-primary leading-relaxed font-medium">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <footer className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">{testimonial.author}</span>
              <span className="mx-1">·</span>
              <span className="text-primary">{testimonial.role}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </div>
  );
}

export default Testimonial;

