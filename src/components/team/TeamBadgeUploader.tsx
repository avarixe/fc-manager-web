import {
  Avatar,
  Button,
  FileInput,
  Grid,
  LoadingOverlay,
  Modal,
  Paper,
} from "@mantine/core";
import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";

import { teamAtom } from "@/atoms";
import { BaseIcon } from "@/components/base/CommonIcons";
import { supabase } from "@/utils/supabase";

export const TeamBadgeUploader: React.FC<{
  opened: boolean;
  onClose: () => void;
}> = ({ opened, onClose }) => {
  const [team, setTeam] = useAtom(teamAtom);

  const [badge, setBadge] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const onClick = useCallback(async () => {
    if (badge && team?.id) {
      setLoading(true);

      const value = await fileToBase64(badge);
      // TODO: save team badge
      await supabase
        .from("teams")
        .update({ badge_path: value })
        .eq("id", team.id);
      setTeam((prev) => (prev ? { ...prev, badge_path: value } : null));
      setLoading(false);
    }
    onClose();
  }, [badge, onClose, setTeam, team?.id]);

  const [dragging, setDragging] = useState(false);
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    console.log(event.dataTransfer.files);
    const file = event.dataTransfer.files[0];
    setBadge(file);
    setDragging(false);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
  }, []);

  const [preview, setPreview] = useState<string>();
  useEffect(() => {
    if (badge) {
      setPreview(URL.createObjectURL(badge));
    }
  }, [badge]);

  const inputRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Change Badge"
      centered
      closeOnClickOutside={false}
      trapFocus
    >
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
      />

      <Grid justify="center">
        <Grid.Col span={5}>
          <Paper
            bg="gray.7"
            shadow="md"
            radius="xl"
            h={150}
            className="flex justify-center items-center"
          >
            <Avatar src={team?.badge_path} size={100}>
              <BaseIcon name="i-mdi:shield-half-full" fz={75} />
            </Avatar>
          </Paper>
        </Grid.Col>
        <Grid.Col span={2} className="flex justify-center items-center">
          <BaseIcon name="i-mdi:arrow-right" fz="xl" />
        </Grid.Col>
        <Grid.Col span={5}>
          <FileInput
            ref={inputRef}
            accept="image/*"
            onChange={setBadge}
            display="none"
          />
          <Paper
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            bg={dragging ? "gray.8" : "gray.7"}
            shadow="md"
            radius="xl"
            h={150}
            className="flex justify-center items-center cursor-pointer"
          >
            {preview ? (
              <Avatar src={preview} size={100} />
            ) : (
              <BaseIcon name="i-mdi:upload" fz={100} />
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      <Button onClick={onClick} fullWidth mt="xl">
        Save
      </Button>
    </Modal>
  );
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsDataURL(file); // Read the file as a data URL
  });
}
