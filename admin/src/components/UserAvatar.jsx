const getInitials = (name, email) => {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

const UserAvatar = ({
  src,
  name,
  email,
  size = 32,
  className = "",
}) => {
  const px = typeof size === "number" ? size : 32;
  const style = { width: px, height: px, minWidth: px, minHeight: px };

  if (src) {
    return (
      <img
        src={src}
        alt={name || email || "User"}
        className={`rounded-full object-cover border border-gray-200 ${className}`}
        style={style}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-white flex items-center justify-center font-semibold text-xs ${className}`}
      style={style}
    >
      {getInitials(name, email)}
    </div>
  );
};

export default UserAvatar;
