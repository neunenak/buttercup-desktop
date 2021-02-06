import * as React from "react";
import styled from "styled-components";
import { basename } from "path-posix";
import { Icon, IPanel, IPanelProps, IPanelStackProps, PanelStack, Spinner } from "@blueprintjs/core";
import { FileSystemInterface } from "@buttercup/file-interface";
// import { State, useState } from "@hookstate/core";
import { FSItem } from "../../library/fsInterface";

const { useCallback, useEffect, useState } = React;

interface DirectoryStatus {
    path: string;
    loading: boolean;
    contents: Array<FSItem>;
}

interface FileChooserPanelProps {
    // items: Array<FSItem>;
    status: DirectoryStatus;
    onEnterDirectory: (path: string) => void;
    path: string;
    // pathsLoading: State<Array<string>>;
    // pathsLoaded: State<Record<string, Array<FSItem>>>;
}

interface FileChooserProps {
    callback: (path: string | null) => void;
    fsInterface: FileSystemInterface;
}

const FILE_COLOUR = "#222";
const FOLDER_COLOUR = "#F7D774";
const ICON_SIZE = 34;
const ITEM_WIDTH = 75;

const CHOOSER_WIDTH = ITEM_WIDTH * 6 + 10;

const Chooser = styled(PanelStack)`
    width: 100%;
    min-width: ${CHOOSER_WIDTH}px;
    height: 100%;
    min-height: 250px;
    display: flex;
    flex-direction: column;
    justify-items: space-between;
    align-items: stretch;
`;
const ChooserContents = styled.div`
    flex: 10 10 auto;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    flex-wrap: wrap;
    padding: 4px;
`;
const ChooserItem = styled.div`
    width: ${ITEM_WIDTH}px;
    max-width: ${ITEM_WIDTH}px;
    min-width: ${ITEM_WIDTH}px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding-top: 10px;
    padding-bottom: 10px;
    cursor: pointer;

    &:hover {
        background-color: #ddd;
    }
`;
const ChooserItemText = styled.div`
    text-align: center;
    font-weight: 450;
    font-size: 80%;
    overflow-wrap: break-word;
    width: 80%;
    margin-top: 4px;
    user-select: none;
`;

class FileChooserPanel extends React.Component<IPanelProps & IPanelStackProps & FileChooserPanelProps> {
    // componentDidUpdate(prevProps) {
    //     console.log("DID UPDATE", {
    //         props: this.props,
    //         prevProps
    //     });
    // }

    handleItemClick(evt, item: FSItem) {
        evt.preventDefault();
        if (item.type === "directory") {
            this.props.onEnterDirectory(item.identifier);
        }
    }

    render() {
        const { contents, loading } = this.props.status;
        return (
            <ChooserContents>
                {loading && (
                    <Spinner />
                )}
                {!loading ? contents.map(item => (
                    <ChooserItem key={item.identifier} onClick={evt => this.handleItemClick(evt, item)}>
                        <Icon
                            icon={item.type === "directory" ? "folder-close" : "document"}
                            iconSize={ICON_SIZE}
                            color={item.type === "directory" ? FOLDER_COLOUR : FILE_COLOUR}
                        />
                        <ChooserItemText>{item.name}</ChooserItemText>
                    </ChooserItem>
                )) : null}
                {/* <ChooserItem>
                    <Icon icon="folder-close" iconSize={ICON_SIZE} color={FOLDER_COLOUR} />
                    <ChooserItemText>My Folder</ChooserItemText>
                </ChooserItem>
                <ChooserItem>
                    <Icon icon="folder-close" iconSize={ICON_SIZE} color={FOLDER_COLOUR} />
                    <ChooserItemText>Another</ChooserItemText>
                </ChooserItem>
                <ChooserItem>
                    <Icon icon="folder-close" iconSize={ICON_SIZE} color={FOLDER_COLOUR} />
                    <ChooserItemText>This is a long name</ChooserItemText>
                </ChooserItem>
                <ChooserItem>
                    <Icon icon="document" iconSize={ICON_SIZE} />
                    <ChooserItemText>example.doc</ChooserItemText>
                </ChooserItem>
                <ChooserItem>
                    <Icon icon="document" iconSize={ICON_SIZE} />
                    <ChooserItemText>taxes.xlsx</ChooserItemText>
                </ChooserItem>
                <ChooserItem>
                    <Icon icon="document" iconSize={ICON_SIZE} />
                    <ChooserItemText>Funny stuff.url</ChooserItemText>
                </ChooserItem>
                <ChooserItem>
                    <Icon icon="document" iconSize={ICON_SIZE} />
                    <ChooserItemText>Stupid-really-long-web-clip.gif</ChooserItemText>
                </ChooserItem>
                <ChooserItem>
                    <Icon icon="document" iconSize={ICON_SIZE} />
                    <ChooserItemText>vault.bcup</ChooserItemText>
                </ChooserItem>
                <ChooserItem>
                    <Icon icon="document" iconSize={ICON_SIZE} />
                    <ChooserItemText>dump.rdb</ChooserItemText>
                </ChooserItem> */}
            </ChooserContents>
        );
    }
}

export function FileChooser(props: FileChooserProps) {
    const [paths, setPaths] = useState<Record<string, DirectoryStatus>>({});
    const [pathStack, setPathStack] = useState<Array<IPanel>>([]);
    const [addPath, setAddPath] = useState(null);
    const fetchPath = useCallback(async (path, status = null) => {
        const thisStatus = status || {
            path,
            loading: true,
            contents: []
        };
        setPaths({
            ...paths,
            [path]: thisStatus
        });
        const results = await props.fsInterface.getDirectoryContents({
            identifier: path,
            name: basename(path)
        });
        setPaths({
            ...paths,
            [path]: {
                ...thisStatus,
                loading: false,
                contents: results
            }
        });
    }, [paths]);
    const handleEnterDirectory = useCallback(path => {
        if (paths[path]) return;
        fetchPath(path);
        setAddPath(path);
    }, [fetchPath, pathStack]);
    const handlePanelClose = useCallback(() => {
        const newStack = [...pathStack];
        newStack.pop();
        setPathStack(newStack);
    }, [pathStack]);
    useEffect(() => {
        fetchPath("/");
    }, []);
    useEffect(() => {
        if (Object.keys(paths).length === 0) {
            setPathStack([]);
            return;
        }
        if (pathStack.length === 0) {
            setPathStack([{
                component: FileChooserPanel,
                title: "/",
                props: {
                    status: paths["/"],
                    onEnterDirectory: handleEnterDirectory,
                    path: "/"
                }
            }]);
            return;
        }
        console.log("ADD STACK", [...pathStack], paths);
        const updatedStack: Array<IPanel> = pathStack.map(previousStack => ({
            ...previousStack,
            props: {
                ...previousStack.props,
                status: paths[(previousStack.props as FileChooserPanelProps).path]
            }
        }));
        if (addPath) {
            updatedStack.push({
                component: FileChooserPanel,
                title: addPath,
                props: {
                    status: paths[addPath],
                    onEnterDirectory: handleEnterDirectory,
                    path: addPath
                }
            });
            setAddPath(null);
        }
        setPathStack(updatedStack);
    }, [paths, addPath]);
    if (pathStack.length === 0) return null;
    return (
        <Chooser
            onClose={handlePanelClose}
            showPanelHeader
            stack={pathStack}
        />
    );
}
