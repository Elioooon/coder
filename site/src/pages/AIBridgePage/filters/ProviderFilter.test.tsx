import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { API } from "#/api/api";
import {
	MockAIProviderAnthropic,
	MockAIProviderBedrock,
} from "#/testHelpers/entities";
import { render } from "#/testHelpers/renderHelpers";
import { ProviderFilter, useProviderFilterMenu } from "./ProviderFilter";

afterEach(() => {
	vi.restoreAllMocks();
});

const ProviderFilterHarness: React.FC = () => {
	const menu = useProviderFilterMenu({
		value: undefined,
		onChange: vi.fn(),
		enabled: true,
	});
	return <ProviderFilter menu={menu} />;
};

it("names the default provider icon unless the label names it or the icon is custom", async () => {
	const user = userEvent.setup();
	vi.spyOn(API, "getAIProviders").mockResolvedValue([
		{ ...MockAIProviderBedrock, name: "bedrock", display_name: "bedrock" },
		{
			...MockAIProviderAnthropic,
			name: "anthropic-prod",
			display_name: "anthropic-prod",
		},
		{
			...MockAIProviderBedrock,
			name: "acme",
			display_name: "Acme",
			icon: "/emojis/1f9ea.png",
		},
	]);
	render(<ProviderFilterHarness />);
	await user.click(screen.getByRole("button", { name: "Select provider" }));

	const bedrock = await screen.findByRole("option", { name: /bedrock/ });
	expect(within(bedrock).getByRole("img")).toHaveAccessibleName("AWS Bedrock");
	expect(
		screen.getByRole("option", { name: /anthropic-prod/ }),
	).toHaveAccessibleName("anthropic-prod");
	expect(screen.getByRole("option", { name: /Acme/ })).toHaveAccessibleName(
		"Acme",
	);
});

it("requests deleted providers so sessions recorded under them stay filterable", async () => {
	const getProviders = vi.spyOn(API, "getAIProviders").mockResolvedValue([]);
	render(<ProviderFilterHarness />);

	await waitFor(() =>
		expect(getProviders).toHaveBeenCalledWith({ include_deleted: true }),
	);
});
