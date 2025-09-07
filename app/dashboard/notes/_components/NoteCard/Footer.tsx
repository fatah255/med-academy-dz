interface FooterProps {
  timeAgo: string;
  title: string;
  authorLabel?: string;
}

const Footer = ({ timeAgo, title, authorLabel = "You" }: FooterProps) => {
  return (
    <div className="bg-card p-3">
      <p className="text-[13px] truncate text-foreground">{title}</p>
      <p className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-muted-foreground truncate">
        {authorLabel}, {timeAgo}
      </p>
    </div>
  );
};

export default Footer;
