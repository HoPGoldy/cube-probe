import { useRequestFileUrl } from "@/services/attachment";
import classNames from "classnames";
import { FC, useState } from "react";
import { FileIcon } from "../file-icon/file-icon";
import { Card, Flex, Image } from "antd";

interface FileCardProps {
  fileId: string;
  fileName: string;
}

export const FileCard: FC<FileCardProps> = (props) => {
  const { fileId, fileName } = props;
  const { mutateAsync: getFileUrl } = useRequestFileUrl();
  const [previewSrc, setPreviewSrc] = useState("");

  const onClick = async () => {
    if (!fileId) return;

    const resp = await getFileUrl(fileId);
    if (resp?.code !== 200) return;

    const url = resp.data;
    const isImage = /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(fileName);
    if (isImage) {
      setPreviewSrc(url);
      console.log("url", url);
      return;
    }

    // 其他类型直接打开链接
    window.open(url);
  };

  return (
    <Card
      size="small"
      className="hover:ring-2 ring-gray-300 dark:ring-neutral-500 transition-all cursor-pointer"
    >
      <Flex
        gap={8}
        align="center"
        className={classNames(
          // 文本截断
          "overflow-hidden whitespace-nowrap text-ellipsis",
        )}
        onClick={onClick}
      >
        <FileIcon name={fileName} />
        <div className="overflow-hidden whitespace-nowrap text-ellipsis">
          {fileName}
        </div>
      </Flex>
      <div className="hidden">
        <Image
          preview={{
            visible: !!previewSrc,
            src: previewSrc,
            onVisibleChange: () => {
              setPreviewSrc("");
            },
          }}
        />
      </div>
    </Card>
  );
};
