import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
	expect,
	screen,
	spyOn,
	userEvent,
	waitFor,
	within,
} from "storybook/test";
import { API } from "#/api/api";
import type { AIProvider } from "#/api/typesGenerated";
import {
	MockAIProviderAnthropic,
	MockAIProviderOpenAI,
} from "#/testHelpers/entities";
import { withDesktopViewport } from "#/testHelpers/storybook";
import { ProviderFilter, useProviderFilterMenu } from "./ProviderFilter";

const providers: AIProvider[] = [
	{
		...MockAIProviderAnthropic,
		name: "anthropic-prod",
		display_name: "Anthropic (prod)",
	},
	{
		...MockAIProviderOpenAI,
		name: "openai-prod",
		display_name: "",
	},
	{
		...MockAIProviderOpenAI,
		name: "acme-gateway",
		type: "openai-compat",
		display_name: "Acme Gateway",
		icon: "/emojis/1f9ea.png",
	},
];

function ProviderFilterWithMenu({ value: initialValue }: { value?: string }) {
	const [value, setValue] = useState(initialValue);
	const menu = useProviderFilterMenu({
		value,
		onChange: (option) => setValue(option?.value),
	});
	return <ProviderFilter menu={menu} />;
}

const meta = {
	title: "pages/AIBridgePage/ProviderFilter",
	component: ProviderFilterWithMenu,
	decorators: [withDesktopViewport],
	beforeEach: () => {
		spyOn(API, "getAIProviders").mockResolvedValue(providers);
	},
} satisfies Meta<typeof ProviderFilterWithMenu>;

export default meta;
type Story = StoryObj<typeof ProviderFilterWithMenu>;

export const Open: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole("button", { name: "Select provider" }),
		);
		await waitFor(() => {
			// Display name wins, and falls back to the configured name.
			expect(
				screen.getByRole("option", { name: /Anthropic \(prod\)/ }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("option", { name: /openai-prod/ }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("option", { name: /Acme Gateway/ }),
			).toBeInTheDocument();
		});
	},
};

export const Empty: Story = {
	beforeEach: () => {
		spyOn(API, "getAIProviders").mockResolvedValue([]);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole("button", { name: "Select provider" }),
		);
		await waitFor(() => {
			expect(screen.getByText("No providers found")).toBeVisible();
		});
		expect(screen.queryByRole("option")).toBeNull();
	},
};

export const Preselected: Story = {
	args: { value: "anthropic-prod" },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => {
			expect(
				canvas.getByRole("button", { name: "Select provider" }),
			).toHaveTextContent("Anthropic (prod)");
		});
	},
};

export const SelectingOption: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole("button", { name: "Select provider" });
		await userEvent.click(button);
		await waitFor(() => {
			expect(
				screen.getByRole("option", { name: /openai-prod/ }),
			).toBeInTheDocument();
		});
		await userEvent.click(screen.getByRole("option", { name: /openai-prod/ }));
		await waitFor(() => {
			expect(button).toHaveTextContent("openai-prod");
		});
	},
};

export const Searching: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole("button", { name: "Select provider" }),
		);
		await waitFor(() => {
			expect(
				screen.getByRole("option", { name: /openai-prod/ }),
			).toBeInTheDocument();
		});
		await userEvent.type(
			screen.getByPlaceholderText("Search provider..."),
			"acme",
		);
		await waitFor(() => {
			expect(
				screen.getByRole("option", { name: /Acme Gateway/ }),
			).toBeInTheDocument();
			expect(screen.queryByRole("option", { name: /openai-prod/ })).toBeNull();
		});
	},
};
