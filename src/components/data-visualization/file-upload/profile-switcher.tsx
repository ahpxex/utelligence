"use client";

import { Button } from "@/components/ui/shadcn/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { useUnifiedDataStore } from "@/store/unified-data-store";
import { Cross2Icon, FileIcon } from "@radix-ui/react-icons";
import React from "react";

export default function ProfileSwitcher() {
	const profilesMap = useUnifiedDataStore((state) => state.profiles);
	const activeProfileId = useUnifiedDataStore((state) => state.activeProfileId);
	const switchProfile = useUnifiedDataStore((state) => state.switchProfile);
	const deleteProfile = useUnifiedDataStore((state) => state.deleteProfile);

	// Convert Map to array only when rendering
	const profiles = React.useMemo(
		() =>
			Array.from(profilesMap.values()).map((profile) => ({
				id: profile.id,
				fileName: profile.file?.name ?? "Unknown",
				createdAt: profile.createdAt,
			})),
		[profilesMap]
	);

	const activeProfile = profiles.find((p) => p.id === activeProfileId);

	if (profiles.length === 0) {
		return null;
	}

	const handleDeleteProfile = (e: React.MouseEvent, profileId: string) => {
		e.stopPropagation();
		deleteProfile(profileId);
	};

	return (
		<div className="flex items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="flex items-center gap-2">
						<FileIcon className="w-4 h-4" />
						<span className="max-w-[200px] truncate">
							{activeProfile ? activeProfile.fileName : "选择文件"}
						</span>
						{profiles.length > 1 && (
							<span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
								{profiles.length}
							</span>
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-64">
					<DropdownMenuLabel>已上传文件</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{profiles.map((profile) => (
						<DropdownMenuItem
							key={profile.id}
							className={`flex items-center justify-between cursor-pointer ${
								profile.id === activeProfileId ? "bg-accent" : ""
							}`}
							onClick={() => switchProfile(profile.id)}
						>
							<div className="flex items-center gap-2 flex-1 min-w-0">
								<FileIcon className="w-4 h-4 flex-shrink-0" />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{profile.fileName}</p>
									<p className="text-xs text-muted-foreground">
										{new Date(profile.createdAt).toLocaleString("zh-CN")}
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground ml-2"
								onClick={(e) => handleDeleteProfile(e, profile.id)}
							>
								<Cross2Icon className="w-3 h-3" />
							</Button>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
