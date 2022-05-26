import React, { useEffect } from "react";
import { Switch } from "@headlessui/react";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { CheckCircleIcon, XIcon } from "@heroicons/react/solid";

const queryClient = new QueryClient();

const useChromeStorage = (...keys: string[]) =>
  useQuery(
    `chromeStorage-${keys.join("-")}`,
    () => {
      return chrome.storage.sync.get(keys);
    },
    { staleTime: 100 }
  );

export default function OptionsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Options />
    </QueryClientProvider>
  );
}

/* This example requires Tailwind CSS v2.0+ */
function Options() {
  const { data, isLoading, error } = useChromeStorage("autoMode", "serverUrl");

  return (
    <div className="max-w-7xl mx-auto px-4 my-8 sm:px-6 lg:px-8">
      {/* We've used 3xl here, but feel free to try other max-widths based on your needs */}
      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <OptionsSettings settings={data} />
        )}
      </div>
    </div>
  );
}

function OptionsSettings({ settings }: { settings?: { [key: string]: any } }) {
  const [showSavedMessage, setShowSavedMessage] = React.useState(false);

  const handleResetSettings = React.useCallback((e) => {
    e.preventDefault();
    chrome.storage.sync.clear(() => {
      console.log("invalidating chromeStorage queries");
      queryClient.invalidateQueries("chromeStorage");
    });
  }, []);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);

      console.log(
        `Form submitted serverUrl=${formData.get(
          "serverUrl"
        )}, autoMode=${formData.get("autoMode")}`
      );

      chrome.storage.sync.set(
        {
          serverUrl: formData.get("serverUrl") ?? settings?.serverUrl,
          autoMode: formData.get("autoMode") === "on",
        },
        function () {
          console.log("Settings saved");

          setShowSavedMessage(true);
        }
      );
    },
    [setShowSavedMessage]
  );

  useEffect(() => {
    // Hide the message after a few seconds
    const timeout = setTimeout(() => {
      setShowSavedMessage(false);
    }, 2400);

    return () => clearTimeout(timeout);
  }, [showSavedMessage, setShowSavedMessage]);

  return (
    <form
      className="space-y-8 divide-y divide-gray-200"
      onSubmit={handleSubmit}
    >
      {showSavedMessage && (
        <SettingsSavedMessage onDismiss={() => setShowSavedMessage(false)} />
      )}
      <div className="space-y-8 divide-y divide-gray-200">
        <div>
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              JSON Hero - Chrome extension settings
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure the extension to your liking.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label
                htmlFor="serverUrl"
                className="block text-sm font-medium text-gray-700"
              >
                Custom Server URL
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="serverUrl"
                  id="serverUrl"
                  defaultValue={settings?.serverUrl}
                  placeholder="https://jsonhero.io"
                  className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <AutoModeToggle enabled={settings?.autoMode} />
            </div>
          </div>
        </div>
      </div>
      <div className="pt-5">
        <div className="flex justify-end">
          <button
            onClick={handleResetSettings}
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Reset settings
          </button>
          <button
            type="submit"
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function AutoModeToggle({ enabled }: { enabled: boolean }) {
  const [isChecked, setIsChecked] = React.useState(enabled);

  return (
    <Switch.Group as="div" className="flex items-center justify-between">
      <span className="flex-grow flex flex-col">
        <Switch.Label
          as="span"
          className="text-sm font-medium text-gray-900"
          passive
        >
          Auto-mode
        </Switch.Label>
        <Switch.Description as="span" className="text-sm text-gray-500">
          Turn on auto-mode to show JSON responses in JSON Hero without having
          to click the button.
        </Switch.Description>
      </span>
      <Switch
        checked={isChecked}
        onChange={setIsChecked}
        name="autoMode"
        className={classNames(
          isChecked ? "bg-indigo-600" : "bg-gray-200",
          "relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        )}
      >
        <span
          aria-hidden="true"
          className={classNames(
            isChecked ? "translate-x-5" : "translate-x-0",
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
          )}
        />
      </Switch>
    </Switch.Group>
  );
}

function SettingsSavedMessage({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="rounded-md bg-green-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircleIcon
            className="h-5 w-5 text-green-400"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-green-800">
            Successfully saved settings
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
            >
              <span className="sr-only">Dismiss</span>
              <XIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
