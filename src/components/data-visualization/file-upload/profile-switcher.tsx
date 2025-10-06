"use client";

import { Badge } from "@/components/ui/shadcn/badge";
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
import { ChevronDownIcon, Cross2Icon, FileTextIcon } from "@radix-ui/react-icons";
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
				fileName: profile.fileName || profile.file?.name || "Unknown",
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
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 gap-2 font-normal">
					<FileTextIcon className="h-4 w-4" />
					<span className="max-w-[150px] truncate">
						{activeProfile ? activeProfile.fileName : "选择文件"}
					</span>
					{profiles.length > 1 && (
						<Badge variant="secondary" className="h-5 px-1.5 text-xs">
							{profiles.length}
						</Badge>
					)}
					<ChevronDownIcon className="h-3 w-3 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-72">
				<DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
					已上传文件
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<div className="max-h-[300px] overflow-y-auto">
					{profiles.map((profile) => (
						<DropdownMenuItem
							key={profile.id}
							className="flex items-center justify-between gap-2 py-2.5"
							onClick={() => switchProfile(profile.id)}
						>
							<div className="flex items-center gap-2 flex-1 min-w-0">
								<FileTextIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
								<div className="flex-1 min-w-0">
									<p
										className={`text-sm truncate ${
											profile.id === activeProfileId ? "font-semibold" : "font-normal"
										}`}
									>
										{profile.fileName}
									</p>
									<p className="text-xs text-muted-foreground">
										{new Date(profile.createdAt).toLocaleString("zh-CN", {
											month: "short",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-1">
								{profile.id === activeProfileId && (
									<Badge variant="default" className="h-5 px-1.5 text-xs">
										当前
									</Badge>
								)}
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={(e) => handleDeleteProfile(e, profile.id)}
								>
									<Cross2Icon className="h-3 w-3" />
								</Button>
							</div>
						</DropdownMenuItem>
					))}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
