import { Flex } from "antd";
import { FC } from "react";

interface EmptyTipProps {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  extra?: React.ReactNode;
}

export const EmptyTip: FC<EmptyTipProps> = ({ title, subTitle, extra }) => {
  return (
    <Flex vertical gap={4} align="center" justify="center">
      {title && <div className="font-bold text-base"> {title}</div>}
      {subTitle && <div className="text-gray-400">{subTitle}</div>}
      {extra && <div>{extra}</div>}
    </Flex>
  );
};
